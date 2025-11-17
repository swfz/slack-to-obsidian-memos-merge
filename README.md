# merge-post

ObsidianMemosにつぶやきとかを集約するためのスクリプト

指定日時の特定SlackチャンネルのPostとObsidianのDailyノートに記述されているObsidianMemosの項目をマージして出力するスクリプト

PCさわれないとき用にSlackポスト、後日スクリプトを実行してObsidianに貼り付ける

```
node merge-posts.js /path/to/obsidian/daily_note 2023-07-30
```

## Environment

| env name | remark |
|:-|:-|
| SLACK_CHANNEL_ID | チャンネルID |
| SLACK_BOT_TOKEN  | Slack APIのToken |

