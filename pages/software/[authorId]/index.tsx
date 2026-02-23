import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout, { siteTitle } from '../../../components/layout';
import styles from '../../../styles/list.module.css';
import GridItem from '../../../components/grid-item';
import MultiSelect from '../../../components/multi-select';
import { includesValue, toSlug } from '../../../lib/utils';
import { YamlApplication } from '../../../lib/types';
import { getSoftware, getSoftwareCategories, getSoftwareLicenses, getSoftwarePlatforms } from '../../../lib/api';
import { ChangeEvent } from 'react';
import { GetBasePath } from '../../../lib/path';

type SoftwareProps = {
  applications: YamlApplication[];
};

const SoftwareAuthor = ({ applications }: SoftwareProps) => {
  const router = useRouter();

  const getSoftwareFiltered = () => {
    return getSoftware().filter((application: YamlApplication) => {
      return matchesFilters(application) ? application : false;
    });
  };

  const matchesFilters = (application: YamlApplication) => {
    const search: string = router.query['search'] as string;
    if (router.query['authorId'] && router.query['authorId'] !== toSlug(application.author)) return false;
    if (router.query['category'] && !includesValue(router.query['category'], application.category)) return false;
    if (router.query['license'] && !includesValue(router.query['license'], application.license)) return false;
    if (router.query['platform'] && !includesValue(router.query['platform'], application.os)) return false;
    if (
      router.query['search'] &&
      application.name?.toLowerCase().indexOf(search) === -1 &&
      application.short_description?.toLowerCase().indexOf(search) === -1 &&
      application.category?.indexOf(search) === -1
    )
      return false;
    return true;
  };

  const onSearch = (event: ChangeEvent) => {
    const el: HTMLInputElement = event.target as HTMLInputElement;
    router.query['search'] = el.value ? el.value.toLowerCase() : '';
    router.push({
      pathname: router.pathname,
      query: router.query,
    });
  };

  const applicationsFiltered: YamlApplication[] = getSoftwareFiltered();
  const title: string = `${siteTitle} - Software`;
  const search: string = router.query['search'] as string;

  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <meta name="description" content={title} />
        <meta name="og:image" content={`${GetBasePath()}/images/software.jpg`} />
        <meta name="og:title" content={title} />
      </Head>
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {applications[0].author} <span className={styles.count}>({applicationsFiltered.length})</span>
          </h1>
        </div>
        <div className={styles.filters}>
          <span className={styles.filterTitle}>Filter by:</span>
          <MultiSelect label="Category" values={getSoftwareCategories()}></MultiSelect>
          <MultiSelect label="License" values={getSoftwareLicenses()}></MultiSelect>
          <MultiSelect label="Platform" values={getSoftwarePlatforms()}></MultiSelect>
          <input
            className={styles.search}
            placeholder="Keyword"
            type="search"
            id="search"
            name="search"
            value={search}
            onChange={onSearch}
          />
        </div>
        <div className={styles.list}>
          {applicationsFiltered.map((application: YamlApplication, itemIndex: number) => (
            <GridItem
              section="software"
              item={application}
              itemIndex={itemIndex}
              key={`${application.slug}-${itemIndex}`}
            ></GridItem>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default SoftwareAuthor;

type Params = {
  params: {
    authorId: string;
  };
};

export async function getStaticPaths() {
  const authorIds: any = {};
  const paths: Params[] = [];
  getSoftware().forEach((application: YamlApplication) => {
    const authorId: string = toSlug(application.author);
    if (authorIds[authorId]) return false;
    authorIds[authorId] = true;
    paths.push({
      params: {
        authorId: authorId,
      },
    });
  });
  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: Params) {
  const applications: any = getSoftware().filter((application: YamlApplication) => {
    return params.authorId === toSlug(application.author) ? application : false;
  });
  return {
    props: {
      applications: applications,
    },
  };
}
