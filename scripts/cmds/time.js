const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "time",
    version: "3.0.8",
    author: "SK-SIDDIK-KHAN",
    countDown: 2,
    role: 0,
    usePrefix: true,
    shortDescription: "Country current time",
    longDescription: "Shows the current time of any country without API.",
    category: "INFO",
    guide: {
      en: "{pn}time <country name or code>"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const input = args.join(" ").trim().toLowerCase();

      if (!input) {
        return message.reply("❌ Please provide a country name");
      }

      const countries = {
        af: "AF", afghanistan: "AF",
        al: "AL", albania: "AL",
        dz: "DZ", algeria: "DZ",
        ad: "AD", andorra: "AD",
        ao: "AO", angola: "AO",
        ag: "AG", antigua: "AG", "antigua and barbuda": "AG",
        ar: "AR", argentina: "AR",
        am: "AM", armenia: "AM",
        au: "AU", aus: "AU", australia: "AU",
        at: "AT", austria: "AT",
        az: "AZ", azerbaijan: "AZ",
        bs: "BS", bahamas: "BS",
        bh: "BH", bahrain: "BH",
        bd: "BD", bangladesh: "BD", bangla: "BD",
        bb: "BB", barbados: "BB",
        by: "BY", belarus: "BY",
        be: "BE", belgium: "BE",
        bz: "BZ", belize: "BZ",
        bj: "BJ", benin: "BJ",
        bt: "BT", bhutan: "BT",
        bo: "BO", bolivia: "BO",
        ba: "BA", bosnia: "BA", "bosnia and herzegovina": "BA",
        bw: "BW", botswana: "BW",
        br: "BR", brazil: "BR", brasil: "BR",
        bn: "BN", brunei: "BN",
        bg: "BG", bulgaria: "BG",
        bf: "BF", "burkina faso": "BF",
        bi: "BI", burundi: "BI",
        cv: "CV", "cape verde": "CV", "cabo verde": "CV",
        kh: "KH", cambodia: "KH",
        cm: "CM", cameroon: "CM",
        ca: "CA", canada: "CA", can: "CA",
        cf: "CF", "central african republic": "CF",
        td: "TD", chad: "TD",
        cl: "CL", chile: "CL",
        cn: "CN", china: "CN", prc: "CN",
        co: "CO", colombia: "CO",
        km: "KM", comoros: "KM",
        cg: "CG", congo: "CG", "republic of congo": "CG",
        cr: "CR", "costa rica": "CR",
        hr: "HR", croatia: "HR",
        cu: "CU", cuba: "CU",
        cy: "CY", cyprus: "CY",
        cz: "CZ", czech: "CZ", "czech republic": "CZ", czechia: "CZ",
        dk: "DK", denmark: "DK",
        dj: "DJ", djibouti: "DJ",
        dm: "DM", dominica: "DM",
        do: "DO", "dominican republic": "DO",
        ec: "EC", ecuador: "EC",
        eg: "EG", egypt: "EG",
        sv: "SV", "el salvador": "SV",
        gq: "GQ", "equatorial guinea": "GQ",
        er: "ER", eritrea: "ER",
        ee: "EE", estonia: "EE",
        sz: "SZ", eswatini: "SZ", swaziland: "SZ",
        et: "ET", ethiopia: "ET",
        fj: "FJ", fiji: "FJ",
        fi: "FI", finland: "FI",
        fr: "FR", france: "FR",
        ga: "GA", gabon: "GA",
        gm: "GM", gambia: "GM", "the gambia": "GM",
        ge: "GE", georgia: "GE",
        de: "DE", germany: "DE", deutschland: "DE",
        gh: "GH", ghana: "GH",
        gr: "GR", greece: "GR",
        gd: "GD", grenada: "GD",
        gt: "GT", guatemala: "GT",
        gn: "GN", guinea: "GN",
        gw: "GW", "guinea bissau": "GW", "guinea-bissau": "GW",
        gy: "GY", guyana: "GY",
        ht: "HT", haiti: "HT",
        hn: "HN", honduras: "HN",
        hu: "HU", hungary: "HU",
        is: "IS", iceland: "IS",
        in: "IN", india: "IN", hindustan: "IN",
        id: "ID", indonesia: "ID",
        ir: "IR", iran: "IR", persia: "IR",
        iq: "IQ", iraq: "IQ",
        ie: "IE", ireland: "IE",
        il: "IL", israel: "IL",
        it: "IT", italy: "IT",
        ci: "CI", "ivory coast": "CI", "cote d ivoire": "CI",
        jm: "JM", jamaica: "JM",
        jp: "JP", japan: "JP", nippon: "JP",
        jo: "JO", jordan: "JO",
        kz: "KZ", kazakhstan: "KZ",
        ke: "KE", kenya: "KE",
        ki: "KI", kiribati: "KI",
        kw: "KW", kuwait: "KW",
        kg: "KG", kyrgyzstan: "KG", kyrgyz: "KG",
        la: "LA", laos: "LA",
        lv: "LV", latvia: "LV",
        lb: "LB", lebanon: "LB",
        ls: "LS", lesotho: "LS",
        lr: "LR", liberia: "LR",
        ly: "LY", libya: "LY",
        li: "LI", liechtenstein: "LI",
        lt: "LT", lithuania: "LT",
        lu: "LU", luxembourg: "LU",
        mg: "MG", madagascar: "MG",
        mw: "MW", malawi: "MW",
        my: "MY", malaysia: "MY",
        mv: "MV", maldives: "MV",
        ml: "ML", mali: "ML",
        mt: "MT", malta: "MT",
        mh: "MH", "marshall islands": "MH",
        mr: "MR", mauritania: "MR",
        mu: "MU", mauritius: "MU",
        mx: "MX", mexico: "MX",
        fm: "FM", micronesia: "FM",
        md: "MD", moldova: "MD",
        mc: "MC", monaco: "MC",
        mn: "MN", mongolia: "MN",
        me: "ME", montenegro: "ME",
        ma: "MA", morocco: "MA",
        mz: "MZ", mozambique: "MZ",
        mm: "MM", myanmar: "MM", burma: "MM",
        na: "NA", namibia: "NA",
        nr: "NR", nauru: "NR",
        np: "NP", nepal: "NP",
        nl: "NL", netherlands: "NL", holland: "NL",
        nz: "NZ", "new zealand": "NZ", newzealand: "NZ",
        ni: "NI", nicaragua: "NI",
        ne: "NE", niger: "NE",
        ng: "NG", nigeria: "NG",
        kp: "KP", "north korea": "KP", dprk: "KP",
        mk: "MK", "north macedonia": "MK", macedonia: "MK",
        no: "NO", norway: "NO",
        om: "OM", oman: "OM",
        pk: "PK", pakistan: "PK",
        pw: "PW", palau: "PW",
        ps: "PS", palestine: "PS",
        pa: "PA", panama: "PA",
        pg: "PG", "papua new guinea": "PG", png: "PG",
        py: "PY", paraguay: "PY",
        pe: "PE", peru: "PE",
        ph: "PH", philippines: "PH",
        pl: "PL", poland: "PL",
        pt: "PT", portugal: "PT",
        qa: "QA", qatar: "QA",
        ro: "RO", romania: "RO",
        ru: "RU", russia: "RU", russian: "RU",
        rw: "RW", rwanda: "RW",
        kn: "KN", "saint kitts and nevis": "KN", "st kitts": "KN",
        lc: "LC", "saint lucia": "LC", "st lucia": "LC",
        vc: "VC", "saint vincent": "VC", "saint vincent and the grenadines": "VC",
        ws: "WS", samoa: "WS",
        sm: "SM", "san marino": "SM",
        st: "ST", "sao tome": "ST", "sao tome and principe": "ST",
        sa: "SA", saudi: "SA", "saudi arabia": "SA", ksa: "SA",
        sn: "SN", senegal: "SN",
        rs: "RS", serbia: "RS",
        sc: "SC", seychelles: "SC",
        sl: "SL", "sierra leone": "SL",
        sg: "SG", singapore: "SG",
        sk: "SK", slovakia: "SK",
        si: "SI", slovenia: "SI",
        sb: "SB", "solomon islands": "SB",
        so: "SO", somalia: "SO",
        za: "ZA", "south africa": "ZA", rsa: "ZA",
        kr: "KR", "south korea": "KR", korea: "KR",
        ss: "SS", "south sudan": "SS",
        es: "ES", spain: "ES",
        lk: "LK", "sri lanka": "LK", srilanka: "LK",
        sd: "SD", sudan: "SD",
        sr: "SR", suriname: "SR",
        se: "SE", sweden: "SE",
        ch: "CH", switzerland: "CH",
        sy: "SY", syria: "SY",
        tw: "TW", taiwan: "TW",
        tj: "TJ", tajikistan: "TJ",
        tz: "TZ", tanzania: "TZ",
        th: "TH", thailand: "TH",
        tl: "TL", "timor leste": "TL", "timor-leste": "TL", "east timor": "TL",
        tg: "TG", togo: "TG",
        to: "TO", tonga: "TO",
        tt: "TT", trinidad: "TT", "trinidad and tobago": "TT",
        tn: "TN", tunisia: "TN",
        tr: "TR", turkey: "TR", turkiye: "TR",
        tm: "TM", turkmenistan: "TM",
        tv: "TV", tuvalu: "TV",
        ug: "UG", uganda: "UG",
        ua: "UA", ukraine: "UA",
        ae: "AE", uae: "AE", emirates: "AE",
        "united arab emirates": "AE", dubai: "AE",
        gb: "GB", uk: "GB", "united kingdom": "GB",
        england: "GB", britain: "GB", "great britain": "GB",
        us: "US", usa: "US", "united states": "US",
        "united states of america": "US", america: "US",
        uy: "UY", uruguay: "UY",
        uz: "UZ", uzbekistan: "UZ",
        vu: "VU", vanuatu: "VU",
        va: "VA", vatican: "VA", "vatican city": "VA",
        ve: "VE", venezuela: "VE",
        vn: "VN", vietnam: "VN",
        ye: "YE", yemen: "YE",
        zm: "ZM", zambia: "ZM",
        zw: "ZW", zimbabwe: "ZW"
      };

      const countryCode = countries[input];

      if (!countryCode) {
        return message.reply(
          `❌ Country "${args.join(" ")}" not found.`
        );
      }

      const zones = moment.tz.zonesForCountry(countryCode);

      if (!zones || !zones.length) {
        return message.reply(
          `❌ Timezone data not available for ${args.join(" ")}.`
        );
      }

      const preferredZones = {
        BD: "Asia/Dhaka",
        IN: "Asia/Kolkata",
        PK: "Asia/Karachi",
        SA: "Asia/Riyadh",
        AE: "Asia/Dubai",
        QA: "Asia/Qatar",
        KW: "Asia/Kuwait",
        BH: "Asia/Bahrain",
        OM: "Asia/Muscat",
        JP: "Asia/Tokyo",
        CN: "Asia/Shanghai",
        KR: "Asia/Seoul",
        SG: "Asia/Singapore",
        MY: "Asia/Kuala_Lumpur",
        TH: "Asia/Bangkok",
        ID: "Asia/Jakarta",
        PH: "Asia/Manila",
        AU: "Australia/Sydney",
        NZ: "Pacific/Auckland",
        GB: "Europe/London",
        FR: "Europe/Paris",
        DE: "Europe/Berlin",
        IT: "Europe/Rome",
        ES: "Europe/Madrid",
        PT: "Europe/Lisbon",
        RU: "Europe/Moscow",
        TR: "Europe/Istanbul",
        BR: "America/Sao_Paulo",
        MX: "America/Mexico_City",
        CA: "America/Toronto",
        US: "America/New_York",
        AR: "America/Argentina/Buenos_Aires",
        CL: "America/Santiago",
        CO: "America/Bogota",
        PE: "America/Lima",
        ZA: "Africa/Johannesburg",
        EG: "Africa/Cairo",
        NG: "Africa/Lagos",
        KE: "Africa/Nairobi",
        GH: "Africa/Accra"
      };

      let timezone =
        preferredZones[countryCode] || zones[0];

      if (!moment.tz.zone(timezone)) {
        timezone = zones[0];
      }

      const now = moment.tz(timezone);

      const time = now.format("hh:mm:ss A");
      const date = now.format("YYYY-MM-DD");
      const day = now.format("dddd");
      const offset = now.format("Z");
      const abbreviation = now.format("z");

      const response =
`╭─────⊙
├
├🌍 𝐂𝐔𝐑𝐑𝐄𝐍𝐓 𝐓𝐈𝐌𝐄
├
├🕛 Time : ${time}
├📅 Date : ${date}
├📝 Day Name : ${day}
├🕒 Location : ${args.join(" ")}
├🌐 Time Zone : ${timezone}
├🕒 UTC Offset : UTC${offset}
├🔤 Zone : ${abbreviation}
├
├𝐎𝐖𝐍𝐄𝐑 : 𝐒𝐊-𝐒𝐈𝐃𝐃𝐈𝐊
╰────────────⊙`;

      return message.reply(response);

    } catch (error) {
      console.error("Time command error:", error);
      return message.reply("❌ Time information আনতে সমস্যা হয়েছে।");
    }
  }
};