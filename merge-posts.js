import { WebClient, LogLevel } from '@slack/web-api'
import { removePositionFromAst, parseAst, createAst, getSlackMessages, markdownToAst, mergePosts, astToMarkdown } from './util.js'
import * as fs from 'fs'

const main = async() => {
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackChannelId = process.env.SLACK_CHANNEL_ID;
  const slackClient = new WebClient(slackToken);

  const args = process.argv.slice(2);
  const targetDate = args[0];
  const markdownFilename = args[1];

  // MD全体のAST
  const ast = markdownToAst(markdownFilename);
  // console.dir(ast, {depth: null});

  const posts = await getSlackMessages(slackClient, slackChannelId, targetDate);
  console.warn(`${posts.length}: 対象日のSlack投稿`);

  const parsed = parseAst(ast);
  console.warn(`${parsed.journals.length}: Journal`);

  // すでに記入されているMemosの中身をpostedとMergeする、時、分でソートした内容を反映させる
  const mergedJournals = mergePosts(posts, parsed.journals, targetDate);
  console.warn(`${mergedJournals.length}: Merge後Journal`);
  console.log(mergedJournals.map(j => `- ${j}`).join("\n"));

  const afterAst = createAst(ast, mergedJournals, parsed.journalsHeaderIndex, parsed.afterJournalsContentsIndex);
  // console.dir(removePositionFromAst(afterAst), {depth: null});

  fs.writeFileSync(markdownFilename, astToMarkdown(afterAst));
}

main()
