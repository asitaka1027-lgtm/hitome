# 🗄️ Cloudflare D1 データベース統合完了

## ✅ 実装完了

- ✅ D1 データベース作成（hitome-db）
- ✅ マイグレーション実行
- ✅ LINE Webhook と D1 統合
- ✅ API エンドポイント作成
  - `/api/threads` - スレッド一覧取得
  - `/api/messages/[id]` - メッセージ履歴取得
- ✅ wrangler.toml 設定

---

## 🔧 Cloudflare Pages での D1 バインディング設定

現在、D1 データベースが作成されましたが、Cloudflare Pages プロジェクトに紐付ける必要があります。

### **手順**

1. **Cloudflare Dashboard にアクセス**
   ```
   https://dash.cloudflare.com/
   ```

2. **Pages を選択**
   - 左メニューから「Workers & Pages」
   - 「hitome」プロジェクトを選択

3. **Settings タブに移動**

4. **Functions セクション**
   - 「D1 database bindings」を探す
   - 「Add binding」をクリック

5. **バインディングを追加**
   ```
   Variable name: DB
   D1 database: hitome-db
   ```
   - 「Save」をクリック

6. **再デプロイ**
   ```bash
   cd /home/user/webapp
   npx wrangler pages deploy out --project-name hitome
   ```

---

## 📊 データベーススキーマ

### **threads テーブル**
```sql
id TEXT PRIMARY KEY
channel TEXT (LINE/GOOGLE)
user_name TEXT
user_id TEXT
status TEXT (unhandled/review/completed)
tags TEXT (JSON array)
last_message TEXT
ai_summary TEXT
ai_intent TEXT
ai_response TEXT
has_danger_word INTEGER
is_read INTEGER
google_rating INTEGER
google_review_comment TEXT
created_at INTEGER (Unix timestamp)
updated_at INTEGER (Unix timestamp)
received_at INTEGER (Unix timestamp)
```

### **messages テーブル**
```sql
id TEXT PRIMARY KEY
thread_id TEXT
sender TEXT (user/store/ai)
content TEXT
created_at INTEGER (Unix timestamp)
```

### **settings テーブル**
```sql
id INTEGER PRIMARY KEY
store_name TEXT
business_hours_start TEXT
business_hours_end TEXT
tone TEXT (polite/standard/casual)
industry TEXT (salon/restaurant/medical)
alert_segment TEXT (immediate/standard/relaxed)
auto_reply_high_rating INTEGER
line_connected INTEGER
google_connected INTEGER
created_at INTEGER
updated_at INTEGER
```

---

## 🧪 テスト方法

### **1. LINE メッセージ送信**

LINEアプリで Bot にメッセージを送信：

```
テストメッセージ
```

### **2. データベース確認**

```bash
# スレッド一覧を取得
curl https://hitome.pages.dev/api/threads

# 特定ステータスのスレッド取得
curl "https://hitome.pages.dev/api/threads?status=unhandled"

# メッセージ履歴取得（thread_id は上記で取得）
curl https://hitome.pages.dev/api/messages/[thread_id]
```

### **3. データベース直接確認**

```bash
# ローカルコンソール
npx wrangler d1 execute hitome-db --command="SELECT * FROM threads"

# リモート（本番）
npx wrangler d1 execute hitome-db --remote --command="SELECT * FROM threads"
```

---

## 🎯 現在の動作フロー

```
LINE アプリ
  ↓ メッセージ送信
LINE サーバー
  ↓ Webhook
Cloudflare Pages Function
  ↓ 署名検証
  ↓ AIパターンマッチング
  ↓ D1 Database に保存
  ├─ threads テーブルに新規スレッド作成
  └─ messages テーブルにメッセージ保存
  ↓ 自動返信生成
  ↓ LINE API で返信送信
  ↓ 返信も messages に保存
  ↓ スレッドステータスを completed に更新
LINE アプリ
```

---

## 📝 保存されるデータ例

### **Thread**
```json
{
  "id": "1735354800000_abc123",
  "channel": "LINE",
  "user_name": "田中太郎",
  "user_id": "U1234567890abcdef",
  "status": "completed",
  "tags": "[\"reservation\"]",
  "last_message": "予約したいです",
  "ai_summary": "予約の問い合わせ。日時・人数の確認が必要",
  "ai_intent": "予約希望",
  "ai_response": "ご予約ありがとうございます...",
  "has_danger_word": 0,
  "is_read": 0,
  "created_at": 1735354800,
  "updated_at": 1735354801,
  "received_at": 1735354800
}
```

### **Messages**
```json
[
  {
    "id": "1735354800000_xyz456",
    "thread_id": "1735354800000_abc123",
    "sender": "user",
    "content": "予約したいです",
    "created_at": 1735354800
  },
  {
    "id": "1735354801000_def789",
    "thread_id": "1735354800000_abc123",
    "sender": "ai",
    "content": "ご予約ありがとうございます。ご希望の日時、人数、メニューを教えてください。",
    "created_at": 1735354801
  }
]
```

---

## 🚀 次のステップ

### **D1 バインディング設定後**

1. ✅ LINE メッセージがデータベースに保存される
2. ✅ API でスレッド一覧を取得できる
3. ⏳ Inbox 画面をデータベース連携に改修（次の実装）
4. ⏳ 手動返信機能追加
5. ⏳ リアルタイム更新

---

## 🔍 トラブルシューティング

### **API が "Database not configured" エラー**

**原因**: D1 バインディングが設定されていない

**解決策**:
1. Cloudflare Dashboard で D1 バインディングを追加
2. Variable name: `DB`
3. D1 database: `hitome-db`
4. 再デプロイ

### **マイグレーションが適用されない**

```bash
# 再度マイグレーション実行
npx wrangler d1 migrations apply hitome-db --remote
```

### **データが保存されない**

```bash
# ログ確認（Cloudflare Dashboard）
# Pages プロジェクト → Deployments → 最新デプロイ → Functions logs
```

---

## 📊 データベース管理コマンド

```bash
# スレッド数確認
npx wrangler d1 execute hitome-db --remote \
  --command="SELECT COUNT(*) as count FROM threads"

# 未対応スレッド確認
npx wrangler d1 execute hitome-db --remote \
  --command="SELECT * FROM threads WHERE status='unhandled'"

# 全データ削除（テスト用）
npx wrangler d1 execute hitome-db --remote \
  --command="DELETE FROM threads; DELETE FROM messages;"
```

---

## ✅ 完了確認

D1 バインディング設定後、以下で動作確認：

```bash
# 1. LINE でメッセージ送信
# 2. API で確認
curl https://hitome.pages.dev/api/threads

# 3. データが返ってくればOK
```

---

**Cloudflare Dashboard で D1 バインディングを設定したら教えてください！**
