import { ClanInfo, Gender, Person, LifeEvent, SurnameData } from './types';

export const CLAN_INFO: ClanInfo = {
  surname: "李",
  hallName: "陇西堂",
  origin: "甘肃陇西",
  ancestor: "李利贞",
  motto: "敦孝弟，睦宗族，和乡邻，明礼让，务本业，端士品，隆师道，修坟墓。",
  generationPoem: "国正天心顺，官清民自安，妻贤夫祸少，子孝父心宽。"
};

const DETAILED_SURNAMES: SurnameData[] = [
  {
    character: "李",
    pinyin: "Lǐ",
    origin: "李氏源出赢姓。颛顼帝高阳氏之后裔皋陶为尧大理（掌管刑法之官），子伯益为舜虞官（掌管山泽），其子孙历三代世袭大理之职，遂以官为氏，称理氏。商末，理利贞避难于伊侯之墟，食木子得活，遂改理为李。",
    totemDescription: "李姓图腾由虎、木、子三部分组成。虎代表皋陶祖先的图腾，木和子代表始祖李利贞食木子避难图腾。",
    famousAncestors: ["李耳(老子)", "李世民", "李白", "李清照"],
    distribution: "李姓是当今中国第一大姓，分布极广。主要集中于河南、山东、四川、河北四省，约占全国李姓总人口的44%。",
    populationRank: 1,
    halls: [
      { name: "陇西堂", description: "李氏最为著名的堂号，源自秦汉时期的陇西郡。", region: "甘肃" },
      { name: "赵郡堂", description: "源自战国赵国，李牧之后。", region: "河北" },
      { name: "青莲堂", description: "源自唐代大诗人李白，号青莲居士。", region: "四川" }
    ]
  },
  {
    character: "王",
    pinyin: "Wáng",
    origin: "王氏主要源出有三：子姓、姬姓和妫姓。子姓王氏产生最早，始祖为比干；姬姓王氏源于周朝王室；妫姓王氏源于陈国。",
    totemDescription: "王姓图腾是酋长戴王冠的象形。象征至高无上的权力。",
    famousAncestors: ["王翦", "王羲之", "王阳明", "王安石"],
    distribution: "王姓分布以北方为主，河南、山东、河北三省为王姓人口最稠密地区。",
    populationRank: 2,
    halls: [
      { name: "太原堂", description: "源自东汉王允，为王氏最显赫的一支。", region: "山西" },
      { name: "琅琊堂", description: "源自秦朝王翦，后代在琅琊发展成为望族。", region: "山东" },
      { name: "三槐堂", description: "北宋王祐手植三槐于庭，言子孙必有为三公者。", region: "河南" }
    ]
  },
  {
    character: "张",
    pinyin: "Zhāng",
    origin: "张氏源于黄帝赐姓。黄帝第五子挥，发明了弓箭，助黄帝平定天下，被赐姓张，封于青阳。",
    totemDescription: "张姓图腾由弓和长组成，意为手持弓箭的人，象征善于制造和使用弓箭。",
    famousAncestors: ["张良", "张飞", "张居正", "张衡"],
    distribution: "张姓在全国分布广泛，主要集中于河南、山东、河北三省。",
    populationRank: 3,
    halls: [
      { name: "清河堂", description: "张姓的主要发源地之一。", region: "河北" },
      { name: "百忍堂", description: "唐代张公艺九世同居，唐高宗问其道，公艺书百个'忍'字。", region: "山东" },
      { name: "金鉴堂", description: "唐丞相张九龄千秋金鉴。", region: "广东" }
    ]
  },
  {
    character: "刘",
    pinyin: "Liú",
    origin: "刘氏源于祁姓，帝尧之后。尧第九子源明受封于刘（今河北大名），子孙以国为氏。",
    totemDescription: "刘姓图腾一位长者手持刻刀，契刻春天和秋天天气到达地球的运作规律。",
    famousAncestors: ["刘邦", "刘彻", "刘备", "刘禹锡"],
    distribution: "刘姓主要分布于四川、河南、江西、山东、河北等地。",
    populationRank: 4,
    halls: [
      { name: "彭城堂", description: "刘氏总堂号，源自汉高祖刘邦老家。", region: "江苏" },
      { name: "汉里堂", description: "纪念大汉皇族。", region: "江苏" },
      { name: "藜照堂", description: "源自刘向燃藜夜读的典故。", region: "不详" }
    ]
  },
  {
    character: "陈",
    pinyin: "Chén",
    origin: "陈氏源于妫姓，舜帝之后。周武王封舜后裔胡公满于陈，子孙以国为氏。",
    totemDescription: "陈姓图腾是旌旗的象形，代表陈国。",
    famousAncestors: ["陈胜", "陈平", "陈霸先", "陈独秀"],
    distribution: "陈姓在南方地区分布极广，尤其是福建、广东、浙江三省。",
    populationRank: 5,
    halls: [
      { name: "颖川堂", description: "陈氏最著名的郡望。", region: "河南" },
      { name: "德星堂", description: "源自东汉陈寔，名德甚高，太史奏德星见五百里。", region: "河南" }
    ]
  },
  {
    character: "姜",
    pinyin: "Jiāng",
    origin: "姜姓源出神农氏，炎帝生于姜水，因以水名为姓。姜子牙周初受封于齐，是姜氏最显赫的始祖。",
    totemDescription: "姜姓图腾是羊和女的组合，代表母系社会中以羊为图腾的氏族。",
    famousAncestors: ["姜子牙", "姜维", "姜夔", "姜珮瑶"],
    distribution: "姜姓在北方分布较广，尤以山东为盛。",
    populationRank: 60,
    halls: [
      { name: "天水堂", description: "姜维后代发展而成。", region: "甘肃" },
      { name: "稼墙堂", description: "纪念神农氏教民稼墙。", region: "各地" }
    ]
  },
  {
    character: "章",
    pinyin: "Zhāng",
    origin: "章氏主要源自姜姓和任姓。齐太公姜尚之后，封于章，以国为氏。又说源于任姓，黄帝赐封。",
    totemDescription: "章姓图腾是音律的象形，代表善于音乐的氏族。",
    famousAncestors: ["章邯", "章太炎", "章学诚", "章若楠"],
    distribution: "章姓主要分布于浙江、江西、安徽三省。",
    populationRank: 118,
    halls: [
      { name: "豫章堂", description: "汉代章平封豫章郡。", region: "江西" }
    ]
  },
  {
    character: "向",
    pinyin: "Xiàng",
    origin: "向氏源出子姓，为宋国公族之后。春秋时期，宋桓公有子名向父，其后代以王父字为氏。",
    totemDescription: "向姓图腾是窗口向着太阳的方向。",
    famousAncestors: ["向秀", "向警予", "向涵之"],
    distribution: "向姓主要分布于湖南、湖北、四川等地。",
    populationRank: 99,
    halls: [
      { name: "河南堂", description: "向氏发源地之一。", region: "河南" },
      { name: "中和堂", description: "取致中和之意。", region: "各地" }
    ]
  }
];

// Helper for rest of Top 100
const COMMON_SURNAMES_LIST = [
  { char: "杨", pinyin: "Yáng" }, { char: "黄", pinyin: "Huáng" }, { char: "赵", pinyin: "Zhào" }, { char: "周", pinyin: "Zhōu" }, { char: "吴", pinyin: "Wú" },
  { char: "徐", pinyin: "Xú" }, { char: "孙", pinyin: "Sūn" }, { char: "马", pinyin: "Mǎ" }, { char: "朱", pinyin: "Zhū" }, { char: "胡", pinyin: "Hú" },
  { char: "郭", pinyin: "Guō" }, { char: "何", pinyin: "Hé" }, { char: "林", pinyin: "Lín" }, { char: "高", pinyin: "Gāo" }, { char: "罗", pinyin: "Luó" },
  { char: "郑", pinyin: "Zhèng" }, { char: "梁", pinyin: "Liáng" }, { char: "谢", pinyin: "Xiè" }, { char: "宋", pinyin: "Sòng" }, { char: "唐", pinyin: "Táng" },
  { char: "许", pinyin: "Xǔ" }, { char: "邓", pinyin: "Dèng" }, { char: "韩", pinyin: "Hán" }, { char: "冯", pinyin: "Féng" }, { char: "曹", pinyin: "Cáo" },
  { char: "彭", pinyin: "Péng" }, { char: "曾", pinyin: "Zēng" }, { char: "萧", pinyin: "Xiāo" }, { char: "田", pinyin: "Tián" }, { char: "董", pinyin: "Dǒng" },
  { char: "潘", pinyin: "Pān" }, { char: "袁", pinyin: "Yuán" }, { char: "蔡", pinyin: "Cài" }, { char: "蒋", pinyin: "Jiǎng" }, { char: "余", pinyin: "Yú" },
  { char: "于", pinyin: "Yú" }, { char: "杜", pinyin: "Dù" }, { char: "叶", pinyin: "Yè" }, { char: "程", pinyin: "Chéng" }, { char: "魏", pinyin: "Wèi" },
  { char: "苏", pinyin: "Sū" }, { char: "吕", pinyin: "Lǚ" }, { char: "丁", pinyin: "Dīng" }, { char: "任", pinyin: "Rèn" }, { char: "卢", pinyin: "Lú" },
  { char: "姚", pinyin: "Yáo" }, { char: "沈", pinyin: "Shěn" }, { char: "钟", pinyin: "Zhōng" }, { char: "姜", pinyin: "Jiāng" }, { char: "崔", pinyin: "Cuī" },
  { char: "谭", pinyin: "Tán" }, { char: "陆", pinyin: "Lù" }, { char: "范", pinyin: "Fàn" }, { char: "汪", pinyin: "Wāng" }, { char: "廖", pinyin: "Liào" },
  { char: "石", pinyin: "Shí" }, { char: "金", pinyin: "Jīn" }, { char: "韦", pinyin: "Wéi" }, { char: "贾", pinyin: "Jiǎ" }, { char: "夏", pinyin: "Xià" },
  { char: "傅", pinyin: "Fù" }, { char: "方", pinyin: "Fāng" }, { char: "白", pinyin: "Bái" }, { char: "邹", pinyin: "Zōu" }, { char: "孟", pinyin: "Mèng" },
  { char: "熊", pinyin: "Xióng" }, { char: "秦", pinyin: "Qín" }, { char: "邱", pinyin: "Qiū" }, { char: "江", pinyin: "Jiāng" }, { char: "尹", pinyin: "Yǐn" },
  { char: "薛", pinyin: "Xuē" }, { char: "阎", pinyin: "Yán" }, { char: "段", pinyin: "Duàn" }, { char: "雷", pinyin: "Léi" }, { char: "侯", pinyin: "Hóu" },
  { char: "龙", pinyin: "Lóng" }, { char: "史", pinyin: "Shǐ" }, { char: "陶", pinyin: "Táo" }, { char: "黎", pinyin: "Lí" }, { char: "贺", pinyin: "Hè" },
  { char: "顾", pinyin: "Gù" }, { char: "毛", pinyin: "Máo" }, { char: "郝", pinyin: "Hǎo" }, { char: "龚", pinyin: "Gōng" }, { char: "邵", pinyin: "Shào" },
  { char: "万", pinyin: "Wàn" }, { char: "钱", pinyin: "Qián" }, { char: "严", pinyin: "Yán" }, { char: "赖", pinyin: "Lài" }, { char: "覃", pinyin: "Tán" },
  { char: "洪", pinyin: "Hóng" }, { char: "武", pinyin: "Wǔ" }, { char: "莫", pinyin: "Mò" }, { char: "孔", pinyin: "Kǒng" }
];

export const MOCK_SURNAMES: SurnameData[] = [
  ...DETAILED_SURNAMES,
  ...COMMON_SURNAMES_LIST
    .filter(item => !DETAILED_SURNAMES.some(ds => ds.character === item.char)) // Deduplicate
    .map((item, index) => ({
    character: item.char,
    pinyin: item.pinyin,
    origin: `${item.char}姓是中国著名姓氏之一，历史悠久，源流众多，多以国为氏或以邑为氏。`,
    totemDescription: "暂无详细图腾数据。",
    famousAncestors: [],
    distribution: "分布广泛，遍布全国。",
    populationRank: index + 10,
    halls: [{ name: `${item.char}氏宗祠`, description: "传统宗祠", region: "各地" }]
  }))
];

export const MOCK_MEMBERS: Person[] = [
  {
    id: "1",
    surname: "李",
    givenName: "崇文",
    courtesyName: "博古",
    generation: 1,
    generationName: "国",
    gender: Gender.Male,
    birthYear: 1850,
    deathYear: 1910,
    spouses: ["王氏"],
    children: ["2", "3"],
    portrait: "https://picsum.photos/200/300?grayscale",
    biography: "清末秀才，主要负责修缮家族祠堂，定居于江南某镇。",
    location: { name: "绍兴", province: "浙江", coordinates: { lat: 29.9958, lng: 120.5861 } }
  },
  {
    id: "2",
    surname: "李",
    givenName: "正道",
    courtesyName: "守义",
    generation: 2,
    generationName: "正",
    gender: Gender.Male,
    birthYear: 1880,
    deathYear: 1945,
    fatherId: "1",
    spouses: ["张氏", "刘氏"],
    children: ["4", "5", "6"],
    portrait: "https://picsum.photos/201/301?grayscale",
    biography: "早年从商，经营丝绸生意，抗战时期捐资助学。",
    location: { name: "杭州", province: "浙江", coordinates: { lat: 30.2741, lng: 120.1551 } }
  },
  {
    id: "3",
    surname: "李",
    givenName: "正德",
    generation: 2,
    generationName: "正",
    gender: Gender.Male,
    birthYear: 1885,
    deathYear: 1950,
    fatherId: "1",
    spouses: ["陈氏"],
    children: ["7"],
    location: { name: "上海", province: "上海", coordinates: { lat: 31.2304, lng: 121.4737 } }
  },
  {
    id: "4",
    surname: "李",
    givenName: "天佑",
    generation: 3,
    generationName: "天",
    gender: Gender.Male,
    birthYear: 1910,
    deathYear: 1985,
    fatherId: "2",
    spouses: ["赵氏"],
    children: ["8", "9"],
    biography: "曾任教于西南联大，后回乡教书育人。",
    location: { name: "昆明", province: "云南", coordinates: { lat: 24.8801, lng: 102.8329 } }
  },
  {
    id: "5",
    surname: "李",
    givenName: "天赐",
    generation: 3,
    generationName: "天",
    gender: Gender.Male,
    birthYear: 1915,
    deathYear: 1990,
    fatherId: "2",
    spouses: [],
    children: [],
    location: { name: "杭州", province: "浙江", coordinates: { lat: 30.2741, lng: 120.1551 } }
  },
  {
    id: "6",
    surname: "李",
    givenName: "婉如",
    generation: 3,
    generationName: "天",
    gender: Gender.Female,
    birthYear: 1920,
    deathYear: 2000,
    fatherId: "2",
    spouses: ["周某"],
    children: [],
    location: { name: "苏州", province: "江苏", coordinates: { lat: 31.2989, lng: 120.5853 } }
  },
  {
    id: "7",
    surname: "李",
    givenName: "天祥",
    generation: 3,
    generationName: "天",
    gender: Gender.Male,
    birthYear: 1918,
    deathYear: 1988,
    fatherId: "3",
    spouses: ["吴氏"],
    children: ["10"],
    location: { name: "上海", province: "上海", coordinates: { lat: 31.2304, lng: 121.4737 } }
  },
  {
    id: "8",
    surname: "李",
    givenName: "心远",
    generation: 4,
    generationName: "心",
    gender: Gender.Male,
    birthYear: 1945,
    fatherId: "4",
    spouses: ["孙氏"],
    children: ["11"],
    biography: "知名书法家，现居北京。",
    location: { name: "北京", province: "北京", coordinates: { lat: 39.9042, lng: 116.4074 } }
  },
  {
    id: "9",
    surname: "李",
    givenName: "心怡",
    generation: 4,
    generationName: "心",
    gender: Gender.Female,
    birthYear: 1950,
    fatherId: "4",
    spouses: ["郑某"],
    children: [],
    location: { name: "昆明", province: "云南", coordinates: { lat: 24.8801, lng: 102.8329 } }
  },
  {
    id: "10",
    surname: "李",
    givenName: "心诚",
    generation: 4,
    generationName: "心",
    gender: Gender.Male,
    birthYear: 1955,
    fatherId: "7",
    spouses: ["王氏"],
    children: ["12"],
    location: { name: "上海", province: "上海", coordinates: { lat: 31.2304, lng: 121.4737 } }
  },
  {
    id: "11",
    surname: "李",
    givenName: "顺之",
    generation: 5,
    generationName: "顺",
    gender: Gender.Male,
    birthYear: 1980,
    fatherId: "8",
    spouses: ["钱氏"],
    children: [],
    location: { name: "北京", province: "北京", coordinates: { lat: 39.9042, lng: 116.4074 } }
  },
  {
    id: "12",
    surname: "李",
    givenName: "顺平",
    generation: 5,
    generationName: "顺",
    gender: Gender.Male,
    birthYear: 1985,
    fatherId: "10",
    spouses: [],
    children: [],
    location: { name: "美国", province: "海外" } // No coordinates for overseas to avoid map mess or add later
  }
];

export const EVENTS: LifeEvent[] = [
  { year: 1850, title: "始祖诞生", description: "李崇文公诞生于浙江绍兴书香门第。", type: "BIRTH" },
  { year: 1880, title: "家族迁徙", description: "因战乱，家族部分支脉迁往杭州定居。", type: "MIGRATION" },
  { year: 1910, title: "科举停废", description: "崇文公感叹时局巨变，立下'务本业'之家训。", type: "ACHIEVEMENT" },
  { year: 1937, title: "抗战爆发", description: "正道公捐出家产支援抗战，家族四散。", type: "DISASTER" },
  { year: 1949, title: "新中国成立", description: "家族成员陆续回乡探亲。", type: "MIGRATION" },
];