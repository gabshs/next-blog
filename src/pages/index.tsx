import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;
  const [nextPage, setNextPage] = useState(next_page);
  const [posts, setPosts] = useState(results);

  function handleLoadPost(): void {
    if (nextPage) {
      const updatedPosts = [...posts];

      fetch(nextPage)
        .then(response => response.json())
        .then(data => {
          data.results.forEach(p => {
            const post: Post = {
              uid: p.uid,
              first_publication_date: p.first_publication_date,
              data: {
                title: p.data.title,
                subtitle: p.data.subtitle,
                author: p.data.author,
              },
            };

            updatedPosts.push(post);
            setNextPage(data.next_page);
          });
        });

      setPosts(updatedPosts);
    }
  }

  return (
    <>
      <Head>
        <title>Teste</title>
      </Head>
      <main className={commonStyles.container}>
        {posts.map(post => {
          return (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <div className={commonStyles.infoContent}>
                    <span>
                      <FiCalendar />
                    </span>
                    <p>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </p>
                  </div>
                  <div className={commonStyles.infoContent}>
                    <span>
                      <FiUser />
                    </span>
                    <p>{post.data.author}</p>
                  </div>
                </div>
              </a>
            </Link>
          );
        })}

        {nextPage ? (
          <button
            type="button"
            onClick={handleLoadPost}
            className={`${styles.loadMore} ${nextPage ? styles.enabled : ''}`}
          >
            Carregar mais posts
          </button>
        ) : (
          ''
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 1 });

  const results: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results,
  };

  return {
    props: { postsPagination },
  };
};
