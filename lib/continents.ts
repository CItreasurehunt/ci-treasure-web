// Shared continent grouping — used by both the events dashboard and communities page filters.
// Three business regions, not raw geography: EMEA merges Europe + Middle East + Africa +
// Russia/Caucasus + Turkey; Asia-Pacific is everything else in Asia + Oceania.
export const CONTINENT_COUNTRIES: Record<string, string[]> = {
  americas: [
    "AG","AR","BB","BO","BR","BS","BZ","CA","CL","CO","CR","CU","DM","DO","EC","GD",
    "GT","GY","HN","HT","JM","KN","LC","MX","NI","PA","PE","PR","PY","SR","SV","TT",
    "US","UY","VC","VE",
  ],
  emea: [
    // Europe
    "AD","AL","AT","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","FI","FR",
    "GB","GR","HR","HU","IE","IS","IT","LI","LT","LU","LV","MC","MD","ME","MK","MT",
    "NL","NO","PL","PT","RO","RS","SE","SI","SK","SM","UA","XK",
    // Russia + Caucasus
    "AM","AZ","GE","RU",
    // Turkey
    "TR",
    // Middle East
    "AE","BH","IQ","IR","IL","JO","KW","LB","OM","PS","QA","SA","SY","YE",
    // Africa
    "AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","CV","DJ","DZ","EG","ER","ET",
    "GA","GH","GM","GN","GQ","GW","KE","KM","LR","LS","LY","MA","MG","ML","MR","MU",
    "MW","MZ","NA","NE","NG","RW","SC","SD","SL","SN","SO","SS","ST","SZ","TD","TG",
    "TN","TZ","UG","ZA","ZM","ZW",
  ],
  apac: [
    // South Asia
    "AF","BD","BT","IN","LK","MV","NP","PK",
    // Southeast Asia
    "BN","ID","KH","LA","MM","MY","PH","SG","TH","TL","VN",
    // East Asia
    "CN","HK","JP","KP","KR","MN","MO","TW",
    // Central Asia
    "KG","KZ","TJ","TM","UZ",
    // Oceania
    "AU","FJ","NZ","PG","SB","TO","VU","WS",
  ],
};

export const CONTINENT_LABELS: Record<string, string> = {
  americas: "Americas",
  emea: "EMEA",
  apac: "Asia-Pacific",
};
