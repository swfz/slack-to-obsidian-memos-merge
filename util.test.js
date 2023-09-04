import { removePositionFromAst, createAst, parseAst, getSlackMessages, markdownToAst, mergePosts, astToMarkdown } from './util.js'

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


// mergePostのテスト memos0, slack0
// mergePostのテスト memos複数, slack0
// mergePostのテスト memos0, slack複数
// mergePostのテスト memos複数, slack複数


// journalAstのテスト

// getSlackMEssageのテスト、モック必要

