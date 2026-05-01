// geoip.js — Extremely accurate IP geolocation with fallback & validation

const fetchWithTimeout = (url, timeout = 4000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${url}`)), timeout)
    ),
  ]);
};

/**
 * الحصول على معلومات الموقع من IP بدقة عالية باستخدام عدة خدمات
 */
export async function getLocationFromIP() {
  // قائمة الخدمات (مرتبة حسب الدقة المعروفة)
  const services = [
    {
      name: "ipwho.is",
      url: "https://ipwho.is/",
      parse: (data) => ({
        country: data.country,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        isp: data.connection?.isp,
        success: data.success === true,
      }),
    },
    {
      name: "ip-api.com",
      url: "https://ip-api.com/json/",
      parse: (data) => ({
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        region: data.regionName,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
        isp: data.isp,
        success: data.status === "success",
      }),
    },
    {
      name: "ipapi.co",
      url: "https://ipapi.co/json/",
      parse: (data) => ({
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        isp: data.org,
        success: !!data.country_code,
      }),
    },
  ];

  let lastError = null;

  for (const service of services) {
    try {
      const response = await fetchWithTimeout(service.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawData = await response.json();
      const parsed = service.parse(rawData);

      // التحقق من صحة النتيجة
      if (
        parsed.success &&
        parsed.countryCode &&
        /^[A-Z]{2}$/.test(parsed.countryCode) &&
        parsed.country &&
        parsed.country !== "Unknown"
      ) {
        // استبعاد نتائج خاطئة معروفة (مثل إرجاع السعودية بدل مصر)
        // يمكنك إضافة أي تصحيحات مخصصة هنا
        if (parsed.countryCode === "SA" && parsed.city?.toLowerCase().includes("cairo")) {
          console.warn(`⚠️ Detected incorrect mapping: ${service.name} returned SA but city suggests Egypt. Correcting...`);
          parsed.countryCode = "EG";
          parsed.country = "Egypt";
        }

        console.log(`✅ Accurate location via ${service.name}: ${parsed.country} (${parsed.countryCode})`);
        return {
          country: parsed.country,
          countryCode: parsed.countryCode,
          city: parsed.city || null,
          region: parsed.region || null,
          latitude: parsed.latitude ?? null,
          longitude: parsed.longitude ?? null,
          timezone: parsed.timezone || null,
          isp: parsed.isp || null,
        };
      } else {
        console.warn(`⚠️ ${service.name} returned invalid/success=false data`);
      }
    } catch (err) {
      console.warn(`⚠️ Geolocation failed (${service.name}):`, err.message);
      lastError = err;
    }
  }

  console.error("❌ All geolocation services failed:", lastError);
  // القيمة الافتراضية
  return {
    country: "Unknown",
    countryCode: null,
    city: null,
    region: null,
    latitude: null,
    longitude: null,
    timezone: null,
    isp: null,
  };
}

/**
 * دالة مبسطة ترجع فقط رمز البلد (للاستخدام في Auth.jsx)
 */
export async function getCountryCodeOnly() {
  const location = await getLocationFromIP();
  return location.countryCode || "US"; // افتراضي US بدلاً من SA لتجنب الخطأ
}

/**
 * إحصائيات الدول من قائمة المستخدمين
 */
export function groupCountryStats(users) {
  const stats = {};
  users.forEach((user) => {
    const country = user.country || "Unknown";
    stats[country] = (stats[country] || 0) + 1;
  });
  return Object.entries(stats)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}