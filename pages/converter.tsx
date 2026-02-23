import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import styles from '../styles/list.module.css';
import { GetBasePath } from '../lib/path';
import { useEffect, useRef, useState } from 'react';
import {
  convertJsToSfz,
  convertJsToXml,
  convertJsToYaml,
  convertSfzToJs,
  convertSfzToXml,
  convertSfzToYaml,
  convertXmlToJs,
  convertXmlToSfz,
  convertXmlToYaml,
  convertYamlToJs,
  convertYamlToSfz,
  convertYamlToXml,
} from '@sfz-tools/core/dist/convert';
import Script from 'next/script';

declare global {
  interface Window {
    ace: any;
  }
}

const fileSfz: string = `<group>
lovel=0
hivel=127
<region>
trigger=attack
pitch_keycenter=60
lokey=30
hikey=61
sample=./samples/C4.wav
<region>
trigger=attack
pitch_keycenter=62
lokey=62
hikey=63
sample=./samples/D4.wav
<region>
trigger=attack
pitch_keycenter=64
lokey=64
hikey=64
sample=./samples/E4.wav
<region>
trigger=attack
pitch_keycenter=65
lokey=65
hikey=66
sample=./samples/F4.wav
`;

const formatJsonCondensedObjects = (value: unknown): string => {
  let output = JSON.stringify(value, null, 2);

  // Collapse single-property objects for a compact-but-readable style.
  const transforms: Array<[RegExp, string]> = [
    [/^(\s*)\{\n\1 {2}("[^"]+": [^\n]+)\n\1\}(,?)$/gm, '$1{$2}$3'],
    [/^(\s*)\{\n\1 {2}("[^"]+": [[{])$/gm, '$1{$2'],
    [/^(\s+)([\]}])\n(\s+)\}(,?)$/gm, '$3$2}$4'],
    [/^(\s*)([\]}])\n\1\}(,?)$/gm, '$1$2}$3'],
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const [regex, replacement] of transforms) {
      const next = output.replace(regex, replacement);
      if (next !== output) {
        changed = true;
        output = next;
      }
    }
  }

  return output;
};

const Software = () => {
  const aceRef = useRef<Record<string, any>>({});
  const aceElRef = useRef<Record<string, HTMLElement>>({});
  const initedRef = useRef<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const errorElRef = useRef<HTMLElement | null>(null);
  const [aceCoreReady, setAceCoreReady] = useState(false);
  const [scriptsReady, setScriptsReady] = useState(false);
  const title: string = `${siteTitle} - Converter`;

  useEffect(() => {
    if (!scriptsReady || initedRef.current) return;

    if (!window.ace || !window.ace.require('ace/ext/modelist')) return;

    const initEditors = async () => {
      initedRef.current = true;
      errorElRef.current = document.getElementById('errors');
      init('ace-sfz');
      init('ace-json');
      init('ace-yaml');
      init('ace-xml');
      await loadFile('ace-sfz', fileSfz, true);
    };
    void initEditors();
  }, [scriptsReady]);

  const handleScriptLoad = () => {
    if (!window.ace) return;
    try {
      const modelist = window.ace.require('ace/ext/modelist');
      if (modelist) setScriptsReady(true);
    } catch {
      // Wait for ext-modelist script to finish loading.
    }
  };

  const init = (id: string) => {
    if (aceElRef.current[id]) return;
    const el = document.getElementById(id);
    if (!el || !window.ace) return;
    aceElRef.current[id] = el;
    aceElRef.current[id].className = 'ace';
    aceRef.current[id] = window.ace.edit(aceElRef.current[id], {
      theme: 'ace/theme/monokai',
    });
    aceRef.current[id].session.on('change', async function () {
      if (loadingRef.current === false) {
        await loadFile(id, aceRef.current[id].getOption('value'));
      }
    });
  };

  const loadFile = async (id: string, file: string, loadAll = false) => {
    loadingRef.current = true;
    try {
      if (errorElRef.current) errorElRef.current.innerHTML = '';
      if (id === 'ace-sfz') {
        if (loadAll) load('ace-sfz', 'sfz', file);
        load('ace-json', 'json', formatJsonCondensedObjects(await convertSfzToJs(file)));
        load('ace-yaml', 'yaml', await convertSfzToYaml(file));
        load('ace-xml', 'xml', await convertSfzToXml(file));
      } else if (id === 'ace-json') {
        load('ace-sfz', 'sfz', convertJsToSfz(JSON.parse(file)));
        if (loadAll) load('ace-json', 'json', file);
        load('ace-yaml', 'yaml', convertJsToYaml(JSON.parse(file)));
        load('ace-xml', 'xml', convertJsToXml(JSON.parse(file)));
      } else if (id === 'ace-yaml') {
        load('ace-sfz', 'sfz', convertYamlToSfz(file));
        load('ace-json', 'json', formatJsonCondensedObjects(convertYamlToJs(file)));
        if (loadAll) load('ace-yaml', 'yaml', file);
        load('ace-xml', 'xml', convertYamlToXml(file));
      } else if (id === 'ace-xml') {
        load('ace-sfz', 'sfz', convertXmlToSfz(file));
        load('ace-json', 'json', formatJsonCondensedObjects(convertXmlToJs(file)));
        load('ace-yaml', 'yaml', convertXmlToYaml(file));
        if (loadAll) load('ace-xml', 'xml', file);
      }
    } catch (e) {
      if (errorElRef.current) errorElRef.current.innerHTML = e as string;
    }
    loadingRef.current = false;
  };

  const load = (id: string, type: string, file: string) => {
    if (type === 'sfz') {
      // Loaded at runtime because the module depends on global ace.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SfzMode = require('../lib/ace/mode-sfz').Mode;
      aceRef.current[id].session.setMode(new SfzMode());
    } else {
      const modelist = window.ace.require('ace/ext/modelist');
      if (!modelist) {
        window.alert('Ace modelist not found, add to a <script> tag.');
      }
      const mode: string = modelist.getModeForPath(`filename.${type}`).mode;
      aceRef.current[id].session.setMode(mode);
    }
    aceRef.current[id].setOption('value', file);
  };

  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <meta name="description" content={title} />
        <meta name="og:image" content={`${GetBasePath()}/images/software.jpg`} />
        <meta name="og:title" content={title} />
      </Head>
      <Script
        src="https://cdn.jsdelivr.net/npm/ace-builds@1.16.0/src-min-noconflict/ace.js"
        onLoad={() => setAceCoreReady(true)}
      />
      {aceCoreReady && (
        <Script
          src="https://cdn.jsdelivr.net/npm/ace-builds@1.16.0/src-min-noconflict/ext-modelist.js"
          onLoad={handleScriptLoad}
        />
      )}
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>Converter</h1>
        </div>
        <div className="editors">
          <div className="editor">file.sfz</div>
          <div className="editor">file.sfz.json</div>
          <div className="editor">file.sfz.yaml</div>
          <div className="editor">file.sfz.xml</div>
        </div>
        <div className="editors">
          <div id="ace-sfz"></div>
          <div id="ace-json"></div>
          <div id="ace-yaml"></div>
          <div id="ace-xml"></div>
        </div>
        <div id="errors"></div>
      </section>
    </Layout>
  );
};

export default Software;
