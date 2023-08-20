import { WebClient, LogLevel } from '@slack/web-api'
import dayjs from 'dayjs';

import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import * as fs from 'fs'

const markdownToAst = (filename) => {
  const markdown = fs.readFileSync(filename);

  return fromMarkdown(markdown, {
    extensions: [frontmatter(['yaml'])],
    mdastExtensions: [frontmatterFromMarkdown(['yaml'])]
  });
}

const astToMarkdown = (ast) => {
  // FIXME: unsafeオプションを使ってエスケープさせないようにしたかったが、うまくいかなかったため場当たり的な対応をしている
  const replacer = (str) => {
    return str
      .replace(/\\\[/g, "[")
      .replace(/\\_/g, "_")
      .replace(/\\&/g, "&")
      .replace(/\\\*/g, "*");
  };

  const options = {
    bullet: '-',
    extensions: [frontmatterToMarkdown(['yaml'])]
  }

  return replacer(toMarkdown(ast, options));
}

const transformer = (message) => {
  const {text, ts} = message;
  const time = dayjs.unix(ts).format('HH:mm');

  return `${time} ${text}`;
}

const getSlackMessages = async(client, channelId, targetDate) => {
  const result = await client.conversations.history({
    channel: channelId
  });

  console.warn(`${result.messages.length}: Slack投稿`);

  const conversationHistory = result.messages;

  const groupByDate = conversationHistory.reduce((acc, message) => {
    const date = dayjs.unix(message.ts).format('YYYY-MM-DD');

    acc[date] = acc[date] || [];

    return {...acc, [date]: [...acc[date], message]};
  }, {});


  return groupByDate[targetDate] ? groupByDate[targetDate].map(transformer).reverse() : [];
}

const createJournalAst = (posts) => {
  const items = posts.map(post => ({
    type: 'listItem',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: post
          }
        ]
      }
    ]
  }));

  const list = {
    type: 'list',
    start: null,
    spread: false,
    children: items
  }

  return list;
}

const getJournals = (journals) => {
  return journals.chilren && journals.children.length > 0 ? journals.map(j => toMarkdown(j.children[0]).replace(/\n$/, '')) : [];
}

const comparePost = (a, b, targetDate) => {
  const aTime = dayjs(`${targetDate}T${a.split(' ')[0]}`);
  const bTime = dayjs(`${targetDate}T${b.split(' ')[0]}`);

  return aTime.isBefore(bTime) ? -1 : 1;
}

const mergePosts = (posts, journals, targetDate) => {
  const merged = posts.concat(journals).sort((a, b) => comparePost(a, b, targetDate));

  return Array.from(new Set(merged));
}

const main = async() => {
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackChannelId = process.env.SLACK_CHANNEL_ID;

  const client = new WebClient(slackToken);

  const args = process.argv.slice(2);
  const targetDate = args[0];
  const markdownFilename = args[1];

  // MD全体のAST
  const ast = markdownToAst(markdownFilename);
  console.dir(ast, {depth: null});

  const posts = await getSlackMessages(client, slackChannelId, targetDate);
  console.warn(`${posts.length}: 対象日のSlack投稿`);

  const targetHeaderIndex = ast.children.findIndex(node => node.type === 'heading' && node.children[0]?.value === 'Journal');
  const journals = getJournals(ast.children[targetHeaderIndex + 1].children);
  console.warn(`${journals.length}: Journal`);

  // すでに記入されているMemosの中身をpostedとMergeする、時、分でソートした内容を反映させる
  const mergedJournals = mergePosts(posts, journals, targetDate);
  console.warn(`${mergedJournals.length}: Merge後Journal`);
  console.log(mergedJournals.map(j => `- ${j}`).join("\n"));

  const children = [
    ...ast.children.slice(0, targetHeaderIndex + 1),
    createJournalAst(mergedJournals),
    ...ast.children.slice(targetHeaderIndex + 2)
  ];

  const afterAst = {...ast, ...{children}}
  // dir(afterAst, {depth: null});

  fs.writeFileSync(markdownFilename, astToMarkdown(afterAst));
}

main()
