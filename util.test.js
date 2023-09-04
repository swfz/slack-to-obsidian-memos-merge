import { removePositionFromAst, createAst, parseAst, markdownToAst, mergePosts, astToMarkdown } from './util.js'
import * as fs from 'fs'

describe.each`
memos | count | journalsHeaderIndex | afterJournalsContentsIndex
${0} | ${0} | ${3} | ${4}
${1} | ${4} | ${3} | ${5}
`('parseAst', ({memos, count, journalsHeaderIndex, afterJournalsContentsIndex}) => {
  const ast = markdownToAst(`./test_daily_note_memos${memos}.md`);
  const parsed = parseAst(ast);

  test('parseAst Journalsの取得件数と各種Index値の取得', () => {
    expect(parsed.journals.length).toBe(count);
    expect(parsed.journalsHeaderIndex).toBe(journalsHeaderIndex);
    expect(parsed.afterJournalsContentsIndex).toBe(afterJournalsContentsIndex);
  });
});

describe('Memos数件', () => {
  const ast = markdownToAst('./test_daily_note_memos1.md');
  const parsed = parseAst(ast);

  test('before AST', () => {
    const astTypes = ast.children.map(node => node.type);
    expect(astTypes).toStrictEqual(['yaml', 'heading', 'paragraph', 'heading', 'list', 'heading', 'list']);
  })

  test('createAst returned AST', () => {
    const journals = [
      '- 00:20 test',
      '- 00:30 test',
    ];
    const afterAst = createAst(ast, journals, parsed.journalsHeaderIndex, parsed.afterJournalsContentsIndex);

    const afterAstTypes = afterAst.children.map(node => node.type);
    expect(afterAstTypes).toStrictEqual(['yaml', 'heading', 'paragraph', 'heading', 'list', 'heading', 'list']);

    const afterAstValues = afterAst.children.map(node => node.children ? node.children[0]?.value : undefined);
    expect(afterAstValues).toStrictEqual([undefined, 'Sample', 'サンプルの文章を色々', 'Journal', undefined, 'Habits', undefined]);
  });
});

describe('Memos0件', () => {
  const ast = markdownToAst('./test_daily_note_memos0.md');
  const parsed = parseAst(ast);

  test('before AST', () => {
    const astTypes = ast.children.map(node => node.type);
    expect(astTypes).toStrictEqual(['yaml', 'heading', 'paragraph', 'heading', 'heading', 'list']);
  })

  test('createAst returned AST', () => {
    const journals = [
      '- 00:20 test',
      '- 00:30 test',
    ];
    const afterAst = createAst(ast, journals, parsed.journalsHeaderIndex, parsed.afterJournalsContentsIndex);

    const afterAstTypes = afterAst.children.map(node => node.type);
    expect(afterAstTypes).toStrictEqual(['yaml', 'heading', 'paragraph', 'heading', 'list', 'heading', 'list']);

    const afterAstValues = afterAst.children.map(node => node.children ? node.children[0]?.value : undefined);
    expect(afterAstValues).toStrictEqual([undefined, 'Sample', 'サンプルの文章を色々', 'Journal', undefined, 'Habits', undefined]);
  });
});

describe('mergePost', () => {
  test('memos数件, slack数件', () => {
    const posts = [
      '00:20 Slack1',
      '02:00 Slack2'
    ];
    const journals = [
      '00:30 Memo1',
      '00:31 Memo2',
    ];

    const merged = mergePosts(posts, journals, '2023-08-01');
    expect(merged).toStrictEqual([
      '00:20 Slack1',
      '00:30 Memo1',
      '00:31 Memo2',
      '02:00 Slack2',
    ]);
  });

  test('memo0, slack0', () => {
    const posts = [];
    const journals = [];

    const merged = mergePosts(posts, journals, '2023-08-01');
    expect(merged).toStrictEqual([]);
  });

  test('memo0, slack数件', () => {
    const posts = [
      '00:20 Slack1',
      '02:00 Slack2'
    ];
    const journals = [];

    const merged = mergePosts(posts, journals, '2023-08-01');
    expect(merged).toStrictEqual([
      '00:20 Slack1',
      '02:00 Slack2'
    ]);
  });

  test('memo数件, slack0', () => {
    const posts = [];
    const journals = [
      '00:30 Memo1',
      '00:31 Memo2',
    ];

    const merged = mergePosts(posts, journals, '2023-08-01');
    expect(merged).toStrictEqual([
      '00:30 Memo1',
      '00:31 Memo2',
    ]);
  });

  test('同時刻', () => {
    const posts = [
      '00:20 Slack1',
      '00:20 Slack2'
    ];
    const journals = [
      '00:20 Memo1',
      '00:20 Memo2',
    ];

    const merged = mergePosts(posts, journals, '2023-08-01');
    expect(merged).toStrictEqual([
      '00:20 Slack1',
      '00:20 Slack2',
      '00:20 Memo1',
      '00:20 Memo2',
    ]);
  });
});

describe('Convert AST and Markdown', () => {
  test('余計な変換がされない', () => {
    const ast = markdownToAst('./test_daily_note_memos1.md');
    const markdown = astToMarkdown(ast);

    expect(markdown).toBe(fs.readFileSync('./test_daily_note_memos1.md', 'utf8'));
  });
});

