import React, { useEffect, useMemo, useState } from 'react';
import MobileMenu from '../src/components/MobileMenu.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { supabase } from '../src/lib/supabase.js';
import { useSeo } from '../src/seo/useSeo.js';
import { staticMeta, postMeta } from '../src/seo/meta.js';

const C = {
  platino: '#c0ccd8',
  platinoClaro: '#e4ecf8',
  acero: '#8898b0',
  azul: '#101a2e',
  azulAcento: '#1a6a8a',
  carbon: '#0d1117',
  negro: '#060608',
  fuego: '#e05c2a',
};

// Markdown → HTML sin permitir HTML crudo, y links externos en pestaña nueva
marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    html() { return ''; },
    link({ href, text }) {
      const safe = /^(https?:|mailto:|\/)/i.test(href || '') ? href : '#';
      const ext = /^https?:/i.test(safe);
      return `<a href="${safe}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
  },
});

function Logo({ size = 40 }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size}>
      <defs>
        <linearGradient id={`blg${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4f6fa" />
          <stop offset="30%" stopColor="#c0ccd8" />
          <stop offset="55%" stopColor="#e4ecf8" />
          <stop offset="80%" stopColor="#7888a0" />
          <stop offset="100%" stopColor="#ccd8e8" />
        </linearGradient>
      </defs>
      <g opacity="0.97">
        <circle cx="200" cy="200" r="187" fill="none" stroke={`url(#blg${size})`} strokeWidth="3" />
        <rect x="105" y="68" width="190" height="264" rx="18" fill="rgba(13,17,23,0.85)" />
        <polygon points="200,92 222,122 200,148 178,122" fill={`url(#blg${size})`} />
        <text x="200" y="238" textAnchor="middle" fontFamily="Georgia, serif" fontSize="50" fontWeight="900" letterSpacing="9" fill={`url(#blg${size})`}>TCB</text>
      </g>
    </svg>
  );
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

function usePosts() {
  const [state, setState] = useState({ loading: !!supabase, posts: [] });
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, body_md, cover_url, category, sources, published_at, updated_at, week_of')
      .eq('status', 'publicado')
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Blog:', error);
        setState({ loading: false, posts: data ?? [] });
      });
  }, []);
  return state;
}

export default function Blog() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { loading, posts } = usePosts();
  const post = slug ? posts.find((p) => p.slug === slug) : null;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  useSeo(slug ? (post ? postMeta(post) : loading ? null : { path: `/blog/${slug}`, title: 'Artículo no encontrado | The Card Box MX', description: 'Este artículo no existe.', noindex: true }) : staticMeta('/blog'));

  return (
    <div style={{ background: C.negro, color: '#fff', minHeight: '100vh', fontFamily: "'Helvetica Neue', Helvetica, sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Manrope:wght@400;500;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: ${C.azulAcento}; color: #fff; }
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-body { font-family: 'Manrope', sans-serif; }
        .card-hover { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.6); }
        .nav-link { background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 500; color: ${C.acero}; transition: color .3s; }
        .nav-link:hover, .nav-link.on { color: ${C.platino}; }
        .crumb { background: none; border: none; color: ${C.acero}; cursor: pointer; font-size: 13px; font-weight: 600; }
        .crumb:hover { color: ${C.platino}; }
        .post-body { font-family: 'Manrope', sans-serif; font-size: 17px; line-height: 1.75; color: #d6dde8; }
        .post-body > * + * { margin-top: 1.1em; }
        .post-body h2 { font-family: 'Fraunces', Georgia, serif; font-size: 28px; font-weight: 600; color: #fff; margin-top: 1.8em; line-height: 1.25; }
        .post-body h3 { font-family: 'Fraunces', Georgia, serif; font-size: 21px; font-weight: 600; color: #fff; margin-top: 1.5em; }
        .post-body a { color: #7cc4e0; text-decoration: underline; text-underline-offset: 3px; }
        .post-body strong { color: #fff; }
        .post-body ul, .post-body ol { padding-left: 1.4em; }
        .post-body li + li { margin-top: .4em; }
        .post-body blockquote { border-left: 3px solid ${C.azulAcento}; padding-left: 16px; color: ${C.platino}; font-style: italic; }
        .post-body img { max-width: 100%; border-radius: 12px; }
        .post-body hr { border: none; border-top: 1px solid rgba(192,204,216,0.15); margin: 2em 0; }
        @media (max-width: 640px) { .hide-mobile { display: none; } .post-body { font-size: 16px; } }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,6,8,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(192,204,216,0.08)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Logo size={38} />
            <span className="font-display" style={{ fontSize: 16, fontWeight: 600, color: C.platino }}>The Card Box</span>
          </button>
          <nav className="desk-nav font-body" style={{ display: 'flex', gap: 22 }}>
            <button className="nav-link hide-mobile" onClick={() => navigate('/')}>Inicio</button>
            <button className="nav-link" onClick={() => navigate('/catalogo')}>Catálogo</button>
            <button className="nav-link on" onClick={() => navigate('/blog')}>Blog</button>
            <button className="nav-link" onClick={() => navigate('/arcade')}>Arcade</button>
            <button className="nav-link hide-mobile" onClick={() => navigate('/rifas')}>Rifas</button>
          </nav>
          <MobileMenu />
        </div>
      </header>

      {slug ? (
        loading ? <Loading /> : post ? <Article post={post} navigate={navigate} more={posts.filter((p) => p.id !== post.id).slice(0, 3)} /> : <NotFound navigate={navigate} />
      ) : (
        <List posts={posts} loading={loading} navigate={navigate} />
      )}

      <footer style={{ padding: '40px 24px 32px', background: C.carbon, borderTop: '1px solid rgba(192,204,216,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={32} />
            <span className="font-display" style={{ fontSize: 15, fontWeight: 600, color: C.platino }}>The Card Box MX</span>
          </div>
          <p className="font-body" style={{ fontSize: 12, color: '#506070' }}>
            © 2026 The Card Box MX · <a href="https://www.instagram.com/thecardboxmx" target="_blank" rel="noopener noreferrer" style={{ color: '#506070', textDecoration: 'none' }}>@TheCardBoxMX</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Loading() {
  return <p className="font-body" style={{ color: C.acero, textAlign: 'center', padding: '120px 24px' }}>Cargando…</p>;
}

function NotFound({ navigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '120px 24px' }}>
      <p className="font-display" style={{ fontSize: 28, color: C.acero, marginBottom: 20 }}>No encontramos ese artículo</p>
      <button className="crumb font-body" onClick={() => navigate('/blog')}>← Ver todos los artículos</button>
    </div>
  );
}

function Cover({ post, height }) {
  return (
    <div style={{
      height, position: 'relative', overflow: 'hidden', display: 'grid', placeItems: 'center',
      background: `radial-gradient(circle at 30% 30%, rgba(26,106,138,0.45), transparent 60%), radial-gradient(circle at 80% 80%, rgba(224,92,42,0.25), transparent 55%), ${C.azul}`,
    }}>
      {post.cover_url
        ? <img src={post.cover_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span className="font-display" style={{ fontSize: height > 200 ? 64 : 44, fontWeight: 900, color: 'rgba(228,236,248,0.9)', letterSpacing: -1 }}>TOP 5</span>}
    </div>
  );
}

function List({ posts, loading, navigate }) {
  const [featured, ...rest] = posts;
  return (
    <>
      <section style={{ padding: '72px 24px 32px', background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${C.azul} 0%, ${C.negro} 70%)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span className="font-body" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: C.azulAcento }}>BLOG</span>
          <h1 className="font-display" style={{ fontSize: 'clamp(38px, 7vw, 60px)', fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, margin: '10px 0 14px' }}>
            Lo que pasó esta semana<br />en el mundo de las cartas
          </h1>
          <p className="font-body" style={{ fontSize: 17, color: C.acero, maxWidth: 620 }}>
            Cada semana el Top 5: lanzamientos, preventas, cartas que se dispararon y noticias de Pokémon, Naruto, One Piece y deportes.
          </p>
        </div>
      </section>

      <section style={{ padding: '24px 24px 90px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {loading ? <Loading /> : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p className="font-display" style={{ fontSize: 28, color: C.acero, marginBottom: 12 }}>Muy pronto ✨</p>
              <p className="font-body" style={{ color: C.acero }}>El primer Top 5 de la semana viene en camino.</p>
            </div>
          ) : (
            <>
              <article onClick={() => navigate(`/blog/${featured.slug}`)} className="card-hover" style={{
                cursor: 'pointer', borderRadius: 22, overflow: 'hidden', marginBottom: 32,
                background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`, border: '1px solid rgba(192,204,216,0.12)',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              }}>
                <Cover post={featured} height={300} />
                <div style={{ padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                  <Meta post={featured} />
                  <h2 className="font-display" style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 700, lineHeight: 1.15 }}>{featured.title}</h2>
                  {featured.excerpt && <p className="font-body" style={{ color: C.acero, fontSize: 15, lineHeight: 1.6 }}>{featured.excerpt}</p>}
                  <span className="font-body" style={{ color: '#7cc4e0', fontWeight: 700, fontSize: 14 }}>Leer artículo →</span>
                </div>
              </article>

              {rest.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
                  {rest.map((p) => <PostCard key={p.id} post={p} navigate={navigate} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function Meta({ post }) {
  return (
    <p className="font-body" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: C.acero }}>
      <span style={{ color: C.fuego }}>{post.category || 'Blog'}</span> · {fmtDate(post.published_at)}
    </p>
  );
}

function PostCard({ post, navigate }) {
  return (
    <article onClick={() => navigate(`/blog/${post.slug}`)} className="card-hover" style={{
      cursor: 'pointer', borderRadius: 18, overflow: 'hidden',
      background: `linear-gradient(165deg, ${C.azul}, ${C.carbon})`, border: '1px solid rgba(192,204,216,0.12)',
      display: 'flex', flexDirection: 'column',
    }}>
      <Cover post={post} height={170} />
      <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Meta post={post} />
        <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.25 }}>{post.title}</h3>
        {post.excerpt && <p className="font-body" style={{ color: C.acero, fontSize: 14, lineHeight: 1.55 }}>{post.excerpt}</p>}
      </div>
    </article>
  );
}

function Article({ post, navigate, more }) {
  const html = useMemo(() => marked.parse(post.body_md || ''), [post.body_md]);
  const sources = Array.isArray(post.sources) ? post.sources.filter((s) => s && s.url) : [];
  return (
    <>
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 40px' }}>
        <button className="crumb font-body" onClick={() => navigate('/blog')} style={{ marginBottom: 24 }}>← Blog</button>
        <Meta post={post} />
        <h1 className="font-display" style={{ fontSize: 'clamp(32px, 6vw, 50px)', fontWeight: 900, letterSpacing: -1, lineHeight: 1.08, margin: '14px 0 16px' }}>{post.title}</h1>
        {post.excerpt && <p className="font-body" style={{ fontSize: 19, color: C.platino, lineHeight: 1.55, marginBottom: 28 }}>{post.excerpt}</p>}
        {post.cover_url && <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 32 }}><Cover post={post} height={340} /></div>}

        <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />

        {sources.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(192,204,216,0.12)' }}>
            <p className="font-body" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: C.acero, marginBottom: 12 }}>FUENTES</p>
            <ul className="font-body" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sources.map((s, i) => (
                <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7cc4e0', fontSize: 14 }}>{s.title || s.url}</a></li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 48, padding: 28, borderRadius: 18, background: `linear-gradient(135deg, rgba(26,106,138,0.25), rgba(16,26,46,0.6))`, border: '1px solid rgba(192,204,216,0.12)', textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>¿Buscas alguna de estas cartas?</p>
          <p className="font-body" style={{ color: C.acero, marginBottom: 18 }}>Revisa el catálogo o escríbenos y te la conseguimos.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/catalogo')} className="font-body" style={{ background: C.azulAcento, color: '#fff', border: 'none', borderRadius: 100, padding: '12px 26px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Ver catálogo</button>
            <a href="https://wa.me/525536513092" target="_blank" rel="noopener noreferrer" className="font-body" style={{ color: C.platino, border: '1px solid rgba(192,204,216,0.25)', borderRadius: 100, padding: '12px 26px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>💬 WhatsApp</a>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>Más del blog</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
              {more.map((p) => <PostCard key={p.id} post={p} navigate={navigate} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
