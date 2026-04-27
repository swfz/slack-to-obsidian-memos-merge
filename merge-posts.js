import { WebClient, LogLevel } from '@slack/web-api'
import { removePositionFromAst, parseAst, createAst, getSlackMessagesGroupedByDate, markdownToAst, mergePosts, astToMarkdown, transformer, targetDates } from './util.js'
import * as fs from 'fs'

const updateDailyNote = (markdownDir, targetDate, groupByDate) => {
  const markdownFilename = `${markdownDir}/${targetDate}.md`;

  if (!fs.existsSync(markdownFilename)) {
    console.warn(`${markdownFilename}: ファイルが存在しないためスキップ`);
    return;
  }

  const ast = markdownToAst(markdownFilename);

  const posts = groupByDate[targetDate] ? groupByDate[targetDate].map(transformer).reverse() : [];
  console.warn(`[${targetDate}] ${posts.length}: 対象日のSlack投稿`);

  const parsed = parseAst(ast);
  console.warn(`[${targetDate}] ${parsed.journals.length}: Journal`);

  const mergedJournals = mergePosts(posts, parsed.journals, targetDate);
  console.warn(`[${targetDate}] ${mergedJournals.length}: Merge後Journal`);
  console.log(mergedJournals.map(j => `- ${j}`).join("\n"));

  const afterAst = createAst(ast, mergedJournals, parsed.journalsHeaderIndex, parsed.afterJournalsContentsIndex);

  fs.writeFileSync(markdownFilename, astToMarkdown(afterAst));
}

const main = async() => {
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackChannelId = process.env.SLACK_CHANNEL_ID;
  const slackClient = new WebClient(slackToken);

  const args = process.argv.slice(2);
  const markdownDir = args[0];
  const baseDate = args[1];
  const term = args[2] ? parseInt(args[2], 10) : 1;

  const groupByDate = await getSlackMessagesGroupedByDate(slackClient, slackChannelId);

  for (const targetDate of targetDates(baseDate, term)) {
    updateDailyNote(markdownDir, targetDate, groupByDate);
  }
}

main()
