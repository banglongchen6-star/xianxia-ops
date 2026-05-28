// 省市区三级联动数据（预览版，覆盖主要省市；上线接入完整库时替换此文件即可）
export interface Region {
  name: string;
  children?: Region[];
}

export const REGIONS: Region[] = [
  { name: "北京市", children: [{ name: "北京市", children: [
    { name: "东城区" }, { name: "西城区" }, { name: "朝阳区" }, { name: "海淀区" }, { name: "丰台区" }, { name: "通州区" }, { name: "昌平区" },
  ] }] },
  { name: "上海市", children: [{ name: "上海市", children: [
    { name: "黄浦区" }, { name: "徐汇区" }, { name: "长宁区" }, { name: "静安区" }, { name: "浦东新区" }, { name: "闵行区" }, { name: "宝山区" },
  ] }] },
  { name: "天津市", children: [{ name: "天津市", children: [
    { name: "和平区" }, { name: "河东区" }, { name: "南开区" }, { name: "河西区" }, { name: "滨海新区" },
  ] }] },
  { name: "重庆市", children: [{ name: "重庆市", children: [
    { name: "渝中区" }, { name: "江北区" }, { name: "南岸区" }, { name: "九龙坡区" }, { name: "渝北区" }, { name: "沙坪坝区" },
  ] }] },
  { name: "广东省", children: [
    { name: "广州市", children: [{ name: "越秀区" }, { name: "天河区" }, { name: "海珠区" }, { name: "白云区" }, { name: "番禺区" }, { name: "黄埔区" }] },
    { name: "深圳市", children: [{ name: "福田区" }, { name: "罗湖区" }, { name: "南山区" }, { name: "宝安区" }, { name: "龙岗区" }, { name: "龙华区" }] },
    { name: "东莞市", children: [{ name: "莞城街道" }, { name: "南城街道" }, { name: "东城街道" }, { name: "万江街道" }] },
    { name: "佛山市", children: [{ name: "禅城区" }, { name: "南海区" }, { name: "顺德区" }, { name: "三水区" }] },
    { name: "珠海市", children: [{ name: "香洲区" }, { name: "斗门区" }, { name: "金湾区" }] },
  ] },
  { name: "江苏省", children: [
    { name: "南京市", children: [{ name: "玄武区" }, { name: "秦淮区" }, { name: "鼓楼区" }, { name: "建邺区" }, { name: "江宁区" }] },
    { name: "苏州市", children: [{ name: "姑苏区" }, { name: "吴中区" }, { name: "相城区" }, { name: "工业园区" }, { name: "昆山市" }] },
    { name: "无锡市", children: [{ name: "梁溪区" }, { name: "锡山区" }, { name: "惠山区" }, { name: "滨湖区" }] },
    { name: "常州市", children: [{ name: "天宁区" }, { name: "钟楼区" }, { name: "新北区" }, { name: "武进区" }] },
  ] },
  { name: "浙江省", children: [
    { name: "杭州市", children: [{ name: "上城区" }, { name: "拱墅区" }, { name: "西湖区" }, { name: "滨江区" }, { name: "余杭区" }, { name: "萧山区" }] },
    { name: "宁波市", children: [{ name: "海曙区" }, { name: "江北区" }, { name: "鄞州区" }, { name: "镇海区" }, { name: "北仑区" }] },
    { name: "温州市", children: [{ name: "鹿城区" }, { name: "龙湾区" }, { name: "瓯海区" }] },
    { name: "金华市", children: [{ name: "婺城区" }, { name: "金东区" }, { name: "义乌市" }] },
  ] },
  { name: "山东省", children: [
    { name: "济南市", children: [{ name: "历下区" }, { name: "市中区" }, { name: "槐荫区" }, { name: "天桥区" }, { name: "历城区" }] },
    { name: "青岛市", children: [{ name: "市南区" }, { name: "市北区" }, { name: "李沧区" }, { name: "崂山区" }, { name: "城阳区" }] },
    { name: "烟台市", children: [{ name: "芝罘区" }, { name: "福山区" }, { name: "莱山区" }] },
    { name: "潍坊市", children: [{ name: "潍城区" }, { name: "奎文区" }, { name: "坊子区" }] },
  ] },
  { name: "四川省", children: [
    { name: "成都市", children: [{ name: "锦江区" }, { name: "青羊区" }, { name: "金牛区" }, { name: "武侯区" }, { name: "成华区" }, { name: "高新区" }] },
    { name: "绵阳市", children: [{ name: "涪城区" }, { name: "游仙区" }, { name: "安州区" }] },
    { name: "宜宾市", children: [{ name: "翠屏区" }, { name: "南溪区" }, { name: "叙州区" }] },
  ] },
  { name: "河南省", children: [
    { name: "郑州市", children: [{ name: "中原区" }, { name: "二七区" }, { name: "金水区" }, { name: "管城区" }, { name: "惠济区" }] },
    { name: "洛阳市", children: [{ name: "老城区" }, { name: "西工区" }, { name: "涧西区" }, { name: "洛龙区" }] },
    { name: "南阳市", children: [{ name: "宛城区" }, { name: "卧龙区" }] },
  ] },
  { name: "湖北省", children: [
    { name: "武汉市", children: [{ name: "江岸区" }, { name: "江汉区" }, { name: "硚口区" }, { name: "武昌区" }, { name: "洪山区" }, { name: "东西湖区" }] },
    { name: "宜昌市", children: [{ name: "西陵区" }, { name: "伍家岗区" }, { name: "点军区" }] },
    { name: "襄阳市", children: [{ name: "襄城区" }, { name: "樊城区" }, { name: "襄州区" }] },
  ] },
  { name: "湖南省", children: [
    { name: "长沙市", children: [{ name: "芙蓉区" }, { name: "天心区" }, { name: "岳麓区" }, { name: "开福区" }, { name: "雨花区" }, { name: "望城区" }] },
    { name: "株洲市", children: [{ name: "荷塘区" }, { name: "芦淞区" }, { name: "石峰区" }, { name: "天元区" }] },
    { name: "湘潭市", children: [{ name: "雨湖区" }, { name: "岳塘区" }] },
  ] },
  { name: "河北省", children: [
    { name: "石家庄市", children: [{ name: "长安区" }, { name: "桥西区" }, { name: "新华区" }, { name: "裕华区" }] },
    { name: "唐山市", children: [{ name: "路南区" }, { name: "路北区" }, { name: "古冶区" }] },
    { name: "保定市", children: [{ name: "竞秀区" }, { name: "莲池区" }, { name: "满城区" }] },
  ] },
  { name: "福建省", children: [
    { name: "福州市", children: [{ name: "鼓楼区" }, { name: "台江区" }, { name: "仓山区" }, { name: "晋安区" }] },
    { name: "厦门市", children: [{ name: "思明区" }, { name: "湖里区" }, { name: "集美区" }, { name: "海沧区" }] },
    { name: "泉州市", children: [{ name: "鲤城区" }, { name: "丰泽区" }, { name: "洛江区" }, { name: "晋江市" }] },
  ] },
  { name: "陕西省", children: [
    { name: "西安市", children: [{ name: "新城区" }, { name: "碑林区" }, { name: "莲湖区" }, { name: "雁塔区" }, { name: "未央区" }, { name: "长安区" }] },
    { name: "宝鸡市", children: [{ name: "渭滨区" }, { name: "金台区" }, { name: "陈仓区" }] },
    { name: "咸阳市", children: [{ name: "秦都区" }, { name: "渭城区" }] },
  ] },
  { name: "辽宁省", children: [
    { name: "沈阳市", children: [{ name: "和平区" }, { name: "沈河区" }, { name: "大东区" }, { name: "皇姑区" }, { name: "铁西区" }] },
    { name: "大连市", children: [{ name: "中山区" }, { name: "西岗区" }, { name: "沙河口区" }, { name: "甘井子区" }] },
  ] },
  { name: "安徽省", children: [
    { name: "合肥市", children: [{ name: "瑶海区" }, { name: "庐阳区" }, { name: "蜀山区" }, { name: "包河区" }] },
    { name: "芜湖市", children: [{ name: "镜湖区" }, { name: "弋江区" }, { name: "鸠江区" }] },
  ] },
];

export function provinces(): string[] {
  return REGIONS.map(r => r.name);
}
export function cities(province: string): string[] {
  return REGIONS.find(r => r.name === province)?.children?.map(c => c.name) ?? [];
}
export function districts(province: string, city: string): string[] {
  const p = REGIONS.find(r => r.name === province);
  return p?.children?.find(c => c.name === city)?.children?.map(d => d.name) ?? [];
}
