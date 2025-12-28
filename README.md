# hitome - 統合Inbox MVP

**"今買う理由"をUIで体感させる、スマホ前提の統合Inboxアプリ**

LINE公式アカウント・Google口コミを一元管理し、AI自動対応とリスク可視化で「見逃しゼロ」を実現します。

---

## 🎯 プロジェクト概要

### 目的
個人店舗向けに、LINE＋Googleの顧客対応を統合管理する軽量MVPアプリ。

### 主要機能
- ✅ **統合Inbox**: LINE・Google口コミを1画面で管理
- 🤖 **AI自動対応**: スタブ実装による返信案・要約・意図分析
- 📊 **リスク可視化**: 未対応・見逃し・危険ワードの即時検知
- ⚙️ **柔軟な設定**: 口調・業種・アラート基準のカスタマイズ
- 📱 **PWA対応**: スマホでインストール可能

---

## 🌐 デモURL

**本番URL**: https://3000-iw5a9q31jrezxpq6uvinr-5634da27.sandbox.novita.ai

---

## 🚀 起動方法

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール＆起動
```bash
# リポジトリをクローン
cd /home/user/webapp

# 依存関係をインストール
npm install

# 開発サーバーを起動（PM2）
pm2 start ecosystem.config.cjs

# ビルド（本番用）
npm run build

# 本番サーバー起動
npm start
```

### ポート
- 開発: `http://localhost:3000`
- PM2で管理されるバックグラウンド実行

---

## 📱 デモ操作手順

### 1. 初回起動（Onboarding）
1. **店舗情報**: 店舗名・営業時間を入力
2. **返信口調**: 丁寧/標準/カジュアルから選択
3. **業種テンプレ**: 美容・飲食・自費診療系を選択
4. **チャネル連携**: LINE・Googleの連携ボタンをタップ（スタブ）
5. **口コミ設定**: ★4〜5自動返信のON/OFF
6. **アラート基準**: 30分/2時間/翌営業日から選択
7. 完了後、Inboxへ自動遷移

### 2. Inbox（メイン画面）
- **KPIチップ**: 未対応・要確認・見逃し・平均初動・ゼロ継続日数
- **セグメントコントロール**: アラート基準の切り替え
- **検索**: 相手名・メッセージ内容で絞り込み
- **フィルタ**: すべて/LINE/口コミ
- **タブ**: 未対応/要確認/完了
- **新規受信シミュレート**: 
  - 📱 LINE受信ボタン → 新しいLINEメッセージを追加
  - ⭐ 口コミ受信ボタン → 新しいGoogle口コミを追加

### 3. Detail（詳細画面）
- **メッセージ履歴**: LINE会話 or Google口コミ本文
- **AIボックス**: 
  - 要約（2行）
  - 意図バッジ（予約希望/質問/クレーム疑い等）
  - 返信案（編集可能）
  - 危険ワード検出時の警告
- **アクション**:
  1. **送信**: そのまま送信 → 完了へ移動
  2. **編集して送信**: モーダルで編集 → 送信
  3. **要確認へ**: 手動対応が必要な場合

### 4. Settings（設定画面）
- 店舗情報・口調・業種・アラート基準の変更
- ★4〜5自動返信のON/OFF
- 危険ワードリスト表示
- 連携状況の確認
- データリセット（デモ用）

---

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **PWA対応** (manifest.json + Service Worker)

### データ永続化
- **localStorage**: 設定・スレッド・メトリクス

### AI機能
- **スタブ実装**: テンプレートベースの生成
- 本番API（OpenAI/Anthropic等）への差し替え可能な構造

### デプロイ
- **PM2**: プロセス管理
- **Next.js Standalone**: 軽量ビルド

---

## 📊 データモデル

### StoreSettings（店舗設定）
```typescript
{
  storeName: string;
  businessHours: { start: string; end: string };
  tone: 'polite' | 'standard' | 'casual';
  industry: 'salon' | 'restaurant' | 'medical';
  alertSegment: 'immediate' | 'standard' | 'relaxed';
  autoReplyHighRating: boolean;
  lineConnected: boolean;
  googleConnected: boolean;
}
```

### Thread（スレッド）
```typescript
{
  id: string;
  channel: 'LINE' | 'GOOGLE';
  userName: string;
  status: 'unhandled' | 'review' | 'completed';
  tags: ThreadTag[];
  lastMessage: string;
  timestamp: Date;
  receivedAt: Date;
  aiSummary: string;
  aiIntent: string;
  aiResponse: string;
  messages?: Message[]; // LINE用
  googleReview?: GoogleReview; // Google用
  hasDangerWord: boolean;
  isRead: boolean;
}
```

### KPIMetrics（KPI指標）
```typescript
{
  unhandledCount: number;       // 未対応数
  reviewCount: number;          // 要確認数
  missedThisMonth: number;      // 見逃し（今月）
  avgResponseMinutes: number;   // 平均初動時間
  zeroUnhandledDays: number;    // 未対応ゼロ継続日数
}
```

---

## 🎨 デザイン要件

### カラーパレット
- **Primary**: `#34C98E` (ミントグリーン)
- **Navy**: `#1E293B` (濃いネイビー)
- **Muted Gray**: `#64748B`
- **Background**: `#FEFFFE` (微グリーンニュアンス)
- **Accent BG**: `#F0FDF8` (薄い緑)

### レイアウト原則
- **中央配置**: `max-width: 430px` の統一コンテナ
- **余白**: Tailwind spacing scaleで統一
- **角丸**: 大きめ（カード: `rounded-2xl`、ボタン: `rounded-xl`）
- **影**: 控えめ（`shadow-subtle`, `shadow-card`）
- **タップ領域**: 最低 `44px` 以上

---

## 🔐 AI自動化ルール

### LINE
✅ **自動OK**:
- 受領確認
- 営業時間/場所/駐車場の質問
- 必要情報の回収（予約なら日時・人数・メニュー）

❌ **自動NG**:
- 料金確約
- クレーム対応
- 医療判断
- キャンセル料など断定的な回答

### Google口コミ
✅ **★4〜5**: 自動返信ON時は定型文返信
❌ **★1〜3**: 自動返信しない → 要確認へ

### 危険ワード検出
以下のワードを含む場合は自動停止 → 要確認へ移動:
```
食中毒、警察、訴える、弁護士、薬、副作用、返金、炎上、
個人情報、訴訟、クレーム、詐欺、被害、通報、騙された、
最悪、二度と行かない
```

---

## 📦 プロジェクト構造

```
webapp/
├── app/
│   ├── components/         # Reactコンポーネント
│   │   ├── Onboarding.tsx  # 初期設定画面
│   │   ├── Inbox.tsx       # メイン画面
│   │   ├── Detail.tsx      # 詳細画面
│   │   ├── Settings.tsx    # 設定画面
│   │   ├── KPIChips.tsx    # KPI表示
│   │   ├── SegmentControl.tsx  # セグメント切替
│   │   ├── ThreadCard.tsx  # スレッドカード
│   │   └── Toast.tsx       # トースト通知
│   ├── lib/                # ユーティリティ
│   │   ├── storage.ts      # localStorage管理
│   │   └── ai-stub.ts      # AI機能スタブ
│   ├── types/
│   │   └── index.ts        # 型定義
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # レイアウト
│   └── page.tsx            # メインページ
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── icon-192.svg        # アイコン (192x192)
│   ├── icon-512.svg        # アイコン (512x512)
│   └── favicon.svg         # Favicon
├── ecosystem.config.cjs    # PM2設定
├── tailwind.config.js      # Tailwind設定
├── tsconfig.json           # TypeScript設定
└── package.json            # 依存関係
```

---

## ✅ 完了した機能

### MVP完成機能
- ✅ Onboarding（6ステップ）
- ✅ Inbox（KPI・検索・フィルタ・タブ）
- ✅ Detail（AI分析・返信案・編集）
- ✅ Settings（全設定の変更）
- ✅ AIスタブ（要約・意図・返信案）
- ✅ 危険ワード検出
- ✅ KPI計測（見逃し・平均初動）
- ✅ デモデータ生成
- ✅ 新規受信シミュレート
- ✅ PWA対応
- ✅ レスポンシブデザイン（スマホ最適化）

---

## 🚧 未実装機能（将来拡張）

### 本番連携
- [ ] LINE公式アカウント OAuth
- [ ] Googleビジネスプロフィール API
- [ ] リアルタイム受信（Webhook）

### AI機能
- [ ] OpenAI/Anthropic API統合
- [ ] 学習データの蓄積
- [ ] カスタムプロンプト編集

### 追加機能
- [ ] 通知機能（Push/メール）
- [ ] 複数店舗対応
- [ ] スタッフアカウント
- [ ] 分析ダッシュボード
- [ ] エクスポート機能

---

## 🎯 推奨される次のステップ

### Phase 1: 本番連携
1. LINE Messaging API統合
2. Google Business Profile API統合
3. Webhook受信サーバー構築

### Phase 2: AI強化
1. OpenAI API統合
2. ベクトルDB導入（過去の対応履歴学習）
3. プロンプトエンジニアリング最適化

### Phase 3: スケール対応
1. PostgreSQL/Supabase移行
2. マルチテナント対応
3. 管理画面（店舗管理・ユーザー管理）

---

## 📖 デプロイメモ

### ローカル開発
```bash
npm run dev  # http://localhost:3000
```

### 本番ビルド
```bash
npm run build
npm start
```

### PM2管理
```bash
pm2 start ecosystem.config.cjs
pm2 logs hitome --nostream
pm2 restart hitome
pm2 delete hitome
```

---

## 🤝 貢献

このプロジェクトはMVPです。改善提案やバグ報告は大歓迎です。

---

## 📄 ライセンス

MIT License

---

## 👤 開発者

**開発**: Genspark AI Agent  
**プロジェクト**: hitome（統合Inbox MVP）  
**作成日**: 2025-12-28  

---

**"見逃しゼロ"を、UIで体感する。**
