# next-rsc-map

`next-rsc-map`は、Next.js App Routerプロジェクトを静的解析し、各ファイルがServer ComponentかClient Componentのいずれであるかを特定するためのCLIツールです。解析結果は、プロジェクトのディレクトリ構造を反映したツリー形式で表示され、開発者がコンポーネントのレンダリングコンテキストを迅速に把握するのに役立ちます。

## 主な機能

- **コンポーネントの分類**: ファイルの内容と依存関係に基づき、各コンポーネントを `Server`, `Client` のいずれかに分類します。
- **`"use client"`の伝播**: `"use client"`ディレクティブを持つファイルを起点とし、そのファイルをインポートするすべてのコンポーネントを再帰的にClient Componentとして分類します。
- **依存関係の追跡**: `--why`フラグを使用することで、特定のファイルがなぜClient Componentとして分類されたのか、その依存関係チェーンを追跡して表示します。
- **直感的な出力**: 解析結果を、アイコン付きの分かりやすいツリー形式でコンソールに表示します。
- **エラー耐性**: TypeScriptの型エラーなど、解析中にエラーが発生したファイルをスキップするオプションを提供し、大規模なプロジェクトでも部分的な解析を実行できます。

## 使い方

### プロジェクト全体の解析

`npx` を使って、解析したいNext.jsプロジェクトのルートディレクトリで以下のコマンドを実行します。`npx` を利用することで、ツールをPCにインストールすることなく、常に最新のバージョンを実行できます。

```bash
npx next-rsc-map
```

もしくはプロジェクトのパスを引数で指定します。

```bash
npx next-rsc-map <プロジェクトへのパス>
```

#### 出力例

```
my-next-app
└── 📁 app (🔴 1, 🟢 2)
   ├── 📁 components (🔴 1)
   │  └── 🔴 client-component.tsx
   ├── 🟢 layout.tsx
   └── 🟢 page.tsx

Total: 🔴 1, 🟢 2

🔴: Client Component
🟢: Server Component
```

### なぜClient Componentなのかを調べる (`--why`)

特定のファイルがなぜClient Componentに分類されたのかを知りたい場合は、`--why`フラグにファイルパスを指定します。これにより、`"use client"`ディレクティブを持つ起点ファイルまでの依存関係チェーンが表示されます。

```bash
npx next-rsc-map --why <ファイルへのパス>
```

#### 出力例 (`--why`)

```
Trace for: app/components/another-client-component.tsx is a Client Component.
Dependency chain:

app/components/client-component.tsx  (contains "use client")
  └─▶ app/components/another-client-component.tsx  <- Target file
```

## オプション

| オプション          | エイリアス | 説明                                                                                             | デフォルト値 |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------ | ------------ |
| `[projectPath]`     |            | 解析対象のNext.jsプロジェクトディレクトリへのパス。                                              | `.`          |
| `--ignore-errors`   | `-i`       | TypeScriptの型エラーが存在する場合でも解析を続行します。エラーのあるファイルはスキップされます。 | `false`      |
| `--why <filePath>`  |            | 指定されたファイルがなぜClient Componentなのか、依存関係チェーンを追跡します。`projectPath`からの相対パスまたは絶対パスで指定します。                   |              |
| `--help`            | `-h`       | ヘルプメッセージを表示します。                                                                   |              |


## グローバルインストール (任意)

頻繁に利用する場合は、グローバルにインストールすることも可能です。

```bash
npm install -g next-rsc-map
```

インストール後、`npx` を付けずにコマンドを実行できます。

```bash
next-rsc-map <プロジェクトへのパス>
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