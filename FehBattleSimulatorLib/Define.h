// 以下の ifdef ブロックは、DLL からのエクスポートを容易にするマクロを作成するための
// 一般的な方法です。この DLL 内のすべてのファイルは、コマンド ラインで定義された FEHBATTLESIMULATORLIB_EXPORTS
// シンボルを使用してコンパイルされます。このシンボルは、この DLL を使用するプロジェクトでは定義できません。
// ソースファイルがこのファイルを含んでいる他のプロジェクトは、
// FEHBATTLESIMULATORLIB_API 関数を DLL からインポートされたと見なすのに対し、この DLL は、このマクロで定義された
// シンボルをエクスポートされたと見なします。
#ifdef FEHBATTLESIMULATORLIB_EXPORTS
#define FEHBATTLESIMULATORLIB_API __declspec(dllexport)
#elif defined FEHSUMMONSIMULATORLIBRARY_EMPTY
#define FEHBATTLESIMULATORLIB_API
#else
#define FEHBATTLESIMULATORLIB_API __declspec(dllimport)
#endif

