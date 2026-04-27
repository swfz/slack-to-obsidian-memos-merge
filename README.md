# merge-post

ObsidianMemosにつぶやきとかを集約するためのスクリプト

指定日時の特定SlackチャンネルのPostとObsidianのDailyノートに記述されているObsidianMemosの項目をマージして出力するスクリプト

PCさわれないとき用にSlackポスト、後日スクリプトを実行してObsidianに貼り付ける

```
node merge-posts.js /path/to/obsidian/daily_note 2023-07-30
```

第3引数 `term` で、指定日付から何日分遡って更新するかを指定できる（オプショナル、デフォルトは1で指定日のみ）。

```
# 2023-07-30 から3日分（2023-07-30, 2023-07-29, 2023-07-28）を更新
node merge-posts.js /path/to/obsidian/daily_note 2023-07-30 3
```

## Environment

| env name | remark |
|:-|:-|
| SLACK_CHANNEL_ID | チャンネルID |
| SLACK_BOT_TOKEN  | Slack APIのToken |

