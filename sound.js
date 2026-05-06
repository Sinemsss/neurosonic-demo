const NeuroSound=(()=>{
  let ctx=null,masterGain=null,analyser=null,currentSound=null,isPlaying=false,animationId=null,scheduledTimers=[];
  function ensureCtx(){
    if(!ctx){
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      masterGain=ctx.createGain();masterGain.gain.value=.6;
      analyser=ctx.createAnalyser();analyser.fftSize=1024;
      masterGain.connect(analyser);analyser.connect(ctx.destination);
    }
    if(ctx.state==="suspended")ctx.resume();
  }
  function load(sd){currentSound=sd;drawIdle();}
  function playOnce(){
    if(!currentSound||currentSound.voices.length===0)return;
    ensureCtx();stopAll();isPlaying=true;
    const beatSec=60/currentSound.tempo_bpm;
    const chips=document.querySelectorAll(".voice-chip");
    currentSound.voices.forEach((v,i)=>{
      const startTime=ctx.currentTime+i*beatSec*.45;
      scheduleVoice(v,startTime);
      const chip=chips[i];
      if(chip){
        scheduledTimers.push(setTimeout(()=>chip.classList.add("playing"),i*beatSec*.45*1000));
        scheduledTimers.push(setTimeout(()=>chip.classList.remove("playing"),(i*beatSec*.45+v.length_sec)*1000));
      }
    });
    const totalDur=(currentSound.voices.length*beatSec*.45+currentSound.voices[currentSound.voices.length-1].length_sec)*1000;
    scheduledTimers.push(setTimeout(()=>{isPlaying=false},totalDur+200));
    drawWaveform();
  }
  function scheduleVoice(v,startTime){
    const osc=ctx.createOscillator();osc.type=v.wave;osc.frequency.value=v.freq;
    if(v.vibrato_hz>.5){
      const vo=ctx.createOscillator();vo.frequency.value=v.vibrato_hz;
      const vg=ctx.createGain();vg.gain.value=4;vo.connect(vg);vg.connect(osc.frequency);
      vo.start(startTime);vo.stop(startTime+v.length_sec+.1);
    }
    const filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=v.cutoff;filter.Q.value=1.5;
    const panner=ctx.createStereoPanner();panner.pan.value=v.pan;
    const gain=ctx.createGain();
    gain.gain.setValueAtTime(0,startTime);
    gain.gain.linearRampToValueAtTime(v.amp,startTime+.05);
    gain.gain.linearRampToValueAtTime(v.amp*.7,startTime+v.length_sec*.4);
    gain.gain.linearRampToValueAtTime(0,startTime+v.length_sec);
    osc.connect(filter).connect(panner).connect(gain).connect(masterGain);
    osc.start(startTime);osc.stop(startTime+v.length_sec+.1);
  }
  function stopAll(){
    isPlaying=false;scheduledTimers.forEach(t=>clearTimeout(t));scheduledTimers=[];
    document.querySelectorAll(".voice-chip").forEach(c=>c.classList.remove("playing"));
    if(animationId){cancelAnimationFrame(animationId);animationId=null;}
    drawIdle();
  }
  function drawWaveform(){
    const canvas=document.getElementById("soundCanvas");if(!canvas||!analyser)return;
    const c=canvas.getContext("2d");canvas.width=canvas.clientWidth;
    const W=canvas.width,H=canvas.height,buf=new Uint8Array(analyser.frequencyBinCount);
    function frame(){
      analyser.getByteTimeDomainData(buf);
      c.fillStyle="#0b1221";c.fillRect(0,0,W,H);
      c.strokeStyle="rgba(34,211,238,0.10)";c.lineWidth=1;
      for(let x=0;x<W;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
      c.strokeStyle="#22d3ee";c.lineWidth=2;c.shadowBlur=16;c.shadowColor="#22d3ee";c.beginPath();
      const slice=W/buf.length;let x=0;
      for(let i=0;i<buf.length;i++){const y=(buf[i]/128)*(H/2);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);x+=slice;}
      c.stroke();c.shadowBlur=0;
      const fb=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(fb);
      const bars=64,barW=W/bars;
      for(let i=0;i<bars;i++){const v=fb[i*4]/255,h=v*30;c.fillStyle=`hsla(${190+i*1.5},90%,${50+v*20}%,0.5)`;c.fillRect(i*barW,H-h,barW-1,h);}
      if(isPlaying)animationId=requestAnimationFrame(frame);else drawIdle();
    }
    frame();
  }
  function drawIdle(){
    const canvas=document.getElementById("soundCanvas");if(!canvas)return;
    const c=canvas.getContext("2d");canvas.width=canvas.clientWidth;
    const W=canvas.width,H=canvas.height;
    c.fillStyle="#0b1221";c.fillRect(0,0,W,H);
    c.strokeStyle="rgba(34,211,238,0.30)";c.lineWidth=1;c.beginPath();c.moveTo(0,H/2);c.lineTo(W,H/2);c.stroke();
    if(currentSound&&currentSound.voices.length>0){
      currentSound.voices.forEach(v=>{
        const x=((v.pan+1)/2)*W,y=H/2-(v.freq-110)/(1760-110)*(H/2-10);
        c.fillStyle="#ef4444";c.shadowBlur=12;c.shadowColor="#ef4444";
        c.beginPath();c.arc(x,y,4+Math.log(v.amp*100),0,Math.PI*2);c.fill();
      });
      c.shadowBlur=0;
    }else{
      c.fillStyle="rgba(255,255,255,0.3)";c.font="13px Inter";c.textAlign="center";
      c.fillText("Sinyal yok — analize başlayın",W/2,H/2-12);
    }
  }
  async function exportWav(){
    if(!currentSound||currentSound.voices.length===0){alert("Önce bir analiz çalıştırın.");return;}
    const sr=44100,beatSec=60/currentSound.tempo_bpm;
    const totalSec=currentSound.voices.length*beatSec*.45+currentSound.voices[currentSound.voices.length-1].length_sec+.5;
    const off=new OfflineAudioContext(2,Math.ceil(totalSec*sr),sr);
    const om=off.createGain();om.gain.value=.7;om.connect(off.destination);
    currentSound.voices.forEach((v,i)=>{
      const st=i*beatSec*.45;
      const osc=off.createOscillator();osc.type=v.wave;osc.frequency.value=v.freq;
      const f=off.createBiquadFilter();f.type="lowpass";f.frequency.value=v.cutoff;f.Q.value=1.5;
      const p=off.createStereoPanner();p.pan.value=v.pan;
      const g=off.createGain();
      g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(v.amp,st+.05);
      g.gain.linearRampToValueAtTime(v.amp*.7,st+v.length_sec*.4);
      g.gain.linearRampToValueAtTime(0,st+v.length_sec);
      osc.connect(f).connect(p).connect(g).connect(om);
      osc.start(st);osc.stop(st+v.length_sec+.1);
    });
    const buf=await off.startRendering();
    const wav=audioBufferToWav(buf);
    const blob=new Blob([wav],{type:"audio/wav"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="neurosonic_lezyon.wav";a.click();
    URL.revokeObjectURL(url);
  }
  function audioBufferToWav(buffer){
    const numCh=buffer.numberOfChannels,sr=buffer.sampleRate;
    const len=buffer.length*numCh*2+44,ab=new ArrayBuffer(len),view=new DataView(ab);
    function ws(o,s){for(let i=0;i<s.length;i++)view.setUint8(o+i,s.charCodeAt(i));}
    ws(0,"RIFF");view.setUint32(4,len-8,true);ws(8,"WAVE");
    ws(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);
    view.setUint16(22,numCh,true);view.setUint32(24,sr,true);
    view.setUint32(28,sr*numCh*2,true);view.setUint16(32,numCh*2,true);view.setUint16(34,16,true);
    ws(36,"data");view.setUint32(40,len-44,true);
    let off=44;const chs=[];for(let c=0;c<numCh;c++)chs.push(buffer.getChannelData(c));
    for(let i=0;i<buffer.length;i++)for(let c=0;c<numCh;c++){
      let s=Math.max(-1,Math.min(1,chs[c][i]));
      view.setInt16(off,s<0?s*0x8000:s*0x7FFF,true);off+=2;
    }
    return ab;
  }
  return{load,playOnce,stopAll,exportWav,setVolume(v){if(masterGain)masterGain.gain.value=v;}};
})();
window.NeuroSound=NeuroSound;
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("playBtn").addEventListener("click",()=>NeuroSound.playOnce());
  document.getElementById("stopBtn").addEventListener("click",()=>NeuroSound.stopAll());
  document.getElementById("downloadBtn").addEventListener("click",()=>NeuroSound.exportWav());
  document.getElementById("volSlider").addEventListener("input",e=>NeuroSound.setVolume(parseInt(e.target.value)/100));
});
