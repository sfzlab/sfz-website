import Head from 'next/head';
import { useEffect } from 'react';
import Layout, { siteTitle } from '../../components/layout';

const destination = 'getting-started/what_is_sfz/';

const Documentation = () => {
  const title: string = `${siteTitle} - Documentation`;

  useEffect(() => {
    window.location.replace(destination);
  }, []);

  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <meta httpEquiv="refresh" content={`0;url=${destination}`} />
        <link rel="canonical" href={destination} />
      </Head>
      <p>Redirecting to documentation...</p>
    </Layout>
  );
};

export default Documentation;

export async function getStaticProps() {
  return {
    props: {},
  };
}
