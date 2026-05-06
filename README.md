# NeuroSonic — MS Lezyon Tespit & Sonifikasyon Sistemi

> 🌐 **Canlı Demo:** https://KULLANICI_ADIN.github.io/REPO_ADI/

> Bilgisayar Mühendisliği Fikir Yarışması başvurusu için geliştirilmiş, FLAIR MR görüntülerinden Multipl Skleroz lezyonlarını otomatik tespit eden ve her lezyonu eşsiz bir frekansa dönüştürerek "beynin sesini" duymanıza olanak sağlayan hibrit yapay zekâ tabanlı klinik karar destek sistemi.

## Bu Sürüm Hakkında

Bu, **GitHub Pages için optimize edilmiş statik versiyon**. Tüm hesaplamalar (FCM segmentasyonu, sınıflandırma, vs.) yerel Python motoruyla **önceden hesaplanmış** ve sonuçlar `data/precomputed.json` dosyasına gömülmüştür. Bu sayede:

- ✅ Tarayıcıda **anında** çalışır, backend gerekmez
- ✅ GitHub Pages'te ücretsiz host edilir
- ✅ Mobile cihazlarda da sorunsuz çalışır
- ✅ HTTPS otomatik

Web Audio API ile sonifikasyon kısmı tamamen tarayıcıda çalışır.

## GitHub Pages'e Deploy

1. Bu klasörü GitHub repo'ya yükle
2. Repo Settings → Pages → Source: `main` branch, root folder
3. 1-2 dakika sonra: `https://KULLANICI_ADIN.github.io/REPO_ADI/`

## Yerelde Test

```bash
cd neurosonic-static
python3 -m http.server 8080
```

Sonra http://localhost:8080 adresini aç.

## Tam Sürüm (Backend ile)

Kendi MR görüntünüzle çalıştırmak isterseniz **tam Python sürümü** mevcuttur — sadece bu klasörün üst dizinindeki `neurosonic/` klasörüne bakın veya yerel makinenize indirin.

## Algoritma

PDF'teki Ekşi vd. (2015) FCM yöntemi + adaptif hiperintensite eşiği + RandomForest sınıflandırıcı + Web Audio sonifikasyon.

## Yasal Uyarı

Bu yazılım yalnızca **eğitim, araştırma ve fikir gösterimi** amaçlıdır. Klinik tanı için kullanılamaz.

## Referans

Z. Ekşi vd., *"MR Görüntüleri Üzerinde MS Lezyonlarının Bilgisayar Destekli Otomatik Tespiti"*, IEEE 2015.
