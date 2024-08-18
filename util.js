import dayjs from 'dayjs';
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {frontmatter} from 'micromark-extension-frontmatter'
import {frontmatterFromMarkdown, frontmatterToMarkdown} from 'mdast-util-frontmatter'
import * as fs from 'fs'

export const removePositionFromAst = (node) => {
  if (node.children) {
    node.children.map(node => removePositionFromAst(node));
  }
  delete node.position;

  return node;
}

export const markdownToAst = (filename) => {
  const markdown = fs.readFileSync(filename);

  return fromMarkdown(markdown, {
    extensions: [frontmatter(['yaml'])],
    mdastExtensions: [frontmatterFromMarkdown(['yaml'])]
  });
}

export const astToMarkdown = (ast) => {
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

export const transformer = (message) => {
  const {text, ts} = message;
  const time = dayjs.unix(ts).format('HH:mm:ss');

  return `${time} ${text}`;
}

export const getSlackMessages = async(client, channelId, targetDate) => {
  const result = await client.conversations.history({
    channel: channelId,
    limit: 999
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

export const createJournalAst = (posts) => {
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

const getJournals = (childrenAst) => {
  return childrenAst.type === 'list' ? childrenAst.children.map(j => toMarkdown(j.children[0]).replace(/\n$/, '')) : [];
}

export const parseAst = (ast) => {
  // console.dir(ast, {depth: null})
  const journalsHeaderIndex = ast.children.findIndex(node => node.type === 'heading' && node.children[0]?.value === 'Journal');
  const journals = getJournals(ast.children[journalsHeaderIndex + 1]);
  const afterJournalsContentsIndex = journals.length === 0 ? journalsHeaderIndex + 1 : journalsHeaderIndex + 2;

  return {journals, journalsHeaderIndex, afterJournalsContentsIndex};
}

const comparePost = (a, b, targetDate) => {
  const aTime = dayjs(`${targetDate}T${a.split(' ')[0]}`);
  const bTime = dayjs(`${targetDate}T${b.split(' ')[0]}`);

  return aTime.isBefore(bTime) ? -1 : 1;
}

export const mergePosts = (posts, journals, targetDate) => {
  const merged = posts.concat(journals).sort((a, b) => comparePost(a, b, targetDate));

  return Array.from(new Set(merged));
}

export const createAst = (ast, journals, headerIndex, afterJournalsContentsIndex) => {

  const children = [
    ...ast.children.slice(0, headerIndex + 1),
    createJournalAst(journals),
    ...ast.children.slice(afterJournalsContentsIndex)
  ];

  return {...ast, ...{children}}
}
