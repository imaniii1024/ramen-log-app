# Ramen Log

ラーメンを食べた日付、店名、ラーメン名を記録する静的Webアプリです。

## 使い方

GitHub Pages:

```text
https://imaniii1024.github.io/ramen-log-app/
```

ローカル確認:

```bash
python3 -m http.server 4181
```

ブラウザで `http://127.0.0.1:4181/ramen-log-app/` を開きます。

## 保存先

記録はブラウザの `localStorage` に保存されます。別端末や別ブラウザとは自動同期されません。

iPhoneで記録した内容は、そのiPhoneのブラウザ内に保存されます。GitHubには記録データは送信されません。

Safariで入力したデータをホーム画面版へ移す場合は、Safari側で「バックアップをコピー」し、ホーム画面版で「バックアップ貼り付け」に貼って「復元」します。
