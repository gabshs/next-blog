import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  const readTime = (): string => {
    const text = post.data.content.reduce((acc, value) => {
      const body = RichText.asText(value.body);

      return acc + body;
    }, '');

    const formattedText = text
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(x => x !== '');

    const time = Math.ceil(formattedText.length / 200);

    return `${time} min`;
  };

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.content}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <div className={commonStyles.infoContent}>
              <span>
                <FiCalendar />
              </span>
              <p>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div className={commonStyles.infoContent}>
              <span>
                <FiUser />
              </span>
              <p>{post.data.author}</p>
            </div>
            <div className={commonStyles.infoContent}>
              <span>
                <FiClock />
              </span>
              <p>{readTime()}</p>
            </div>
          </div>

          {post.data.content.map(c => {
            return (
              <div className={styles.article} key={c.heading}>
                <h2>{c.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(c.body),
                  }}
                />
              </div>
            );
          })}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };

  // TODO
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});

  const response = await prismic.getByUID('posts', String(slug));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
  };

  // TODO
};
