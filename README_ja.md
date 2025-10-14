# next-rsc-map

`next-rsc-map`は、Next.js App Routerプロジェクトを静的解析し、各ファイルがServer ComponentかClient Componentのいずれであるかを特定するためのCLIツールです。解析結果は、
プロジェクトのディレクトリ構造を反映したツリー形式で表示され、開発者がコンポーネントのレンダリングコンテキストを迅速に把握するのに役立ちます。

## 主な機能

- **コンポーネントの分類**: ファイルの内容と依存関係に基づき、各コンポーネントを `Server`, `Client` のいずれかに分類します。
- **`"use client"`の伝播**: `"use client"`ディレクティブを持つファイルを起点とし、そのファイルをインポートするすべてのコンポーネントを再帰的にClient Componentとして分類します。
- **直感的な出力**: 解析結果を、アイコン付きの分かりやすいツリー形式でコンソールに表示します。
- **エラー耐性**: TypeScriptの型エラーなど、解析中にエラーが発生したファイルをスキップするオプションを提供し、大規模なプロジェクトでも部分的な解析を実行できます。

## インストール

```bash
npm install -g next-rsc-map
```

## 使い方

解析したいNext.jsプロジェクトのルートディレクトリで、以下のコマンドを実行します。

```bash
next-rsc-map
```

もしくはプロジェクトのパスを引数で指定します。

```bash
next-rsc-map <プロジェクトへのパス>
```

### 出力例

```
my-next-app
└── 📁 app (🔴 1, 🟢 2)
   ├── 📁 components (🔴 1)
   │  └── 🔴 client-component.tsx
   ├── 🟢 layout.tsx
   └── 🟢 page.tsx

Total: 🔴 1, 🟢 2

🟢: Server Component
🔴: Client Component
```

## オプション

### `--ignore-errors`

プロジェクト内にTypeScriptの型エラーが存在する場合でも、解析を続行します。エラーが発生したファイルはスキップされ、出力結果にその旨が注記されます。

```bash
npx next-rsc-map <プロジェクトへのパス> --ignore-errors
```

## 開発者向け

### セットアップ

```bash
git clone https://github.com/ediezindell/next-rsc-map.git
cd next-rsc-map
npm install
```

### ビルド

TypeScriptのソースコードをコンパイルします。

```bash
npm run build
```

### テスト

Vitestを使用してテストを実行します。

```bash
npm test
```
