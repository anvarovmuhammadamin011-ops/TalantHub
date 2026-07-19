// Uzbekistan's administrative regions (viloyatlar) and their districts (tumanlar),
// used to build a structured region -> district address picker for vacancies.
export const REGIONS = {
  "Toshkent shahri": [
    "Bektemir", "Chilonzor", "Mirzo Ulug'bek", "Mirobod", "Olmazor", "Sergeli",
    "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yangihayot", "Yashnobod", "Yunusobod",
  ],
  "Toshkent viloyati": [
    "Bekobod", "Bo'stonliq", "Bo'ka", "Chinoz", "Qibray", "Ohangaron", "Oqqo'rg'on",
    "Parkent", "Piskent", "Quyichirchiq", "O'rtachirchiq", "Yuqorichirchiq", "Yangiyo'l", "Zangiota",
  ],
  "Andijon viloyati": [
    "Andijon shahri", "Andijon tumani", "Asaka", "Baliqchi", "Bo'z", "Buloqboshi",
    "Izboskan", "Jalaquduq", "Xo'jaobod", "Qo'rg'ontepa", "Marhamat", "Oltinko'l",
    "Paxtaobod", "Shahrixon", "Ulug'nor",
  ],
  "Farg'ona viloyati": [
    "Farg'ona shahri", "Farg'ona tumani", "Beshariq", "Bog'dod", "Buvayda", "Dang'ara",
    "Furqat", "Qo'shtepa", "Quva", "Quvasoy", "Rishton", "So'x", "Toshloq", "Uchko'prik",
    "O'zbekiston tumani", "Yozyovon", "Marg'ilon", "Qo'qon",
  ],
  "Namangan viloyati": [
    "Namangan shahri", "Namangan tumani", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq",
    "Norin", "Pop", "To'raqo'rg'on", "Uychi", "Uchqo'rg'on", "Yangiqo'rg'on", "Davlatobod",
  ],
  "Sirdaryo viloyati": [
    "Guliston", "Boyovut", "Mirzaobod", "Oqoltin", "Sardoba", "Sayxunobod",
    "Sirdaryo tumani", "Xovos", "Yangiyer", "Shirin",
  ],
  "Jizzax viloyati": [
    "Jizzax shahri", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Zomin",
    "Zafarobod", "Zarbdor", "Mirzacho'l", "Paxtakor", "Sharof Rashidov",
  ],
  "Samarqand viloyati": [
    "Samarqand shahri", "Samarqand tumani", "Bulung'ur", "Ishtixon", "Jomboy",
    "Kattaqo'rg'on", "Qo'shrabot", "Narpay", "Nurobod", "Oqdaryo", "Pastdarg'om",
    "Payariq", "Paxtachi", "Toyloq", "Urgut",
  ],
  "Buxoro viloyati": [
    "Buxoro shahri", "Buxoro tumani", "Vobkent", "G'ijduvon", "Jondor", "Kogon",
    "Qorako'l", "Qorovulbozor", "Peshku", "Romitan", "Shofirkon", "Olot",
  ],
  "Navoiy viloyati": [
    "Navoiy shahri", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa",
    "Tomdi", "Uchquduq", "Xatirchi", "Zarafshon",
  ],
  "Qashqadaryo viloyati": [
    "Qarshi shahri", "Qarshi tumani", "Chiroqchi", "Dehqonobod", "G'uzor", "Kasbi",
    "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Shahrisabz", "Yakkabog'", "Kamashi",
  ],
  "Surxondaryo viloyati": [
    "Termiz shahri", "Angor", "Bandixon", "Boysun", "Denov", "Jarqo'rg'on", "Muzrabot",
    "Oltinsoy", "Qiziriq", "Qumqo'rg'on", "Sariosiyo", "Sherobod", "Sho'rchi", "Uzun",
  ],
  "Xorazm viloyati": [
    "Urganch shahri", "Urganch tumani", "Bog'ot", "Gurlan", "Xazorasp", "Xonqa",
    "Qo'shko'pir", "Shovot", "Yangiariq", "Yangibozor", "Xiva",
  ],
  "Qoraqalpog'iston Respublikasi": [
    "Nukus shahri", "Nukus tumani", "Amudaryo", "Beruniy", "Chimboy", "Ellikqal'a",
    "Kegeyli", "Mo'ynoq", "Qanliko'l", "Qo'ng'irot", "Qorao'zak", "Shumanay",
    "Taxtako'pir", "To'rtko'l", "Xo'jayli",
  ],
};

export const REGION_NAMES = Object.keys(REGIONS);
