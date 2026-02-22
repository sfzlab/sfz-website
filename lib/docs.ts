import fs from 'fs';
import { globSync } from 'glob';
import { join } from 'path';
import matter from 'gray-matter';
import { YamlDocument } from './types';

function getDocument(folder: string, slug: string[]) {
  const docDir: string = join(process.cwd(), 'data', folder, slug.join('/') + '.md');
  // console.log('getDocument', docDir);
  const fileContents = fs.readFileSync(docDir, 'utf8');
  const { data, content } = matter(fileContents);
  return {
    slug: slug,
    title: data.title || slug.join('/'),
    content,
  };
}

function getDocumentList(folder: string) {
  // console.log('getDocumentList', folder);
  const slugs: string[][] = getDocumentSlugs(folder);
  return slugs.map((slug) => {
    const document: YamlDocument = getDocument(folder, slug);
    return {
      title: document.title,
      slug: document.slug,
    };
  });
}

function getDocuments(folder: string) {
  // console.log('getDocuments', folder);
  const slugs: string[][] = getDocumentSlugs(folder);
  return slugs.map((slug) => getDocument(folder, slug));
}

function getDocumentSlugs(folder: string) {
  const dirRoot: string = join(process.cwd(), 'data', folder);
  // console.log('getDocuments', dirRoot);
  const filenames = globSync('**/*.md', { cwd: dirRoot });
  return filenames.map((filename: string) => filename.replace('.md', '').split('/'));
}

export { getDocument, getDocumentList, getDocuments, getDocumentSlugs };
