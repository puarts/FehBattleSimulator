/// @file
/// @brief 複数ファイル間で参照するグローバル変数の定義です。

const g_siteRootPath = "https://puarts.com/";
const g_imageRootPath = g_siteRootPath + "AetherRaidTacticsBoard/images/";
const g_corsImageRootPath = "../images/"; // CORS制約を回避するため画像認識のテンプレート等はローカル画像を参照
const g_audioRootPath = g_siteRootPath + "AetherRaidTacticsBoard/audio/";
const g_heroIconRootPath = g_siteRootPath + "blog/images/FehHeroThumbs/";
const g_skillIconRootPath = g_siteRootPath + "blog/images/FehSkillIcons/";
const TurnSettingCookiePrefix = "turn_";
const UnitCookiePrefix = "unit_";
const StructureCookiePrefix = "st_";
const TileCookiePrefix = "t_";
const TurnWideCookieId = "turnwide";
const NameValueDelimiter = '=';
const ElemDelimiter = ':';
const ValueDelimiter = '|';
const ArrayValueElemDelimiter = '+';
const DebugModeDefault = true;
const TabChar = "&emsp;&emsp;";
