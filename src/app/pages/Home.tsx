import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { brand } from '../../shared/brand'
import styles from './Home.module.css'

export function HomePage() {
  const { isAuthenticated, isCook, isAdmin, isEditor } = useAuth()

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Apresentação">
        <div className={styles.heroScrim} aria-hidden />
        <div className={styles.heroContent}>
          <p className={`${styles.brandMark} fade-up`}>
            <span className={styles.brandName}>{brand.name}</span>
            {brand.tagline ? <span className={styles.brandTag}>{brand.tagline}</span> : null}
          </p>
          <h1 className={`${styles.headline} fade-up-delay`}>
            O acervo público de receitas, em demonstração
          </h1>
          <p className={`${styles.lead} fade-up-late`}>
            Explore categorias, busque pratos e veja o detalhe de cada receita — sem precisar de conta
            para começar.
          </p>
          <div className={`${styles.ctaGroup} fade-up-late`}>
            <Link to="/receitas" className={styles.ctaPrimary}>
              Explorar receitas
            </Link>
            {isCook ? (
              <Link to="/cook/receitas" className={styles.ctaSecondary}>
                Minhas receitas
              </Link>
            ) : isAdmin ? (
              <Link to="/admin/usuarios" className={styles.ctaSecondary}>
                Ir ao admin
              </Link>
            ) : isEditor ? (
              <Link to="/editor/ingredientes" className={styles.ctaSecondary}>
                Ir ao editor
              </Link>
            ) : isAuthenticated ? (
              <Link to="/login" className={styles.ctaSecondary}>
                Entrar como cozinheiro
              </Link>
            ) : (
              <Link to="/login" className={styles.ctaSecondary}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className={styles.support}>
        <h2>Como funciona</h2>
        <p>
          Esta é a vitrine pública do acervo: navegue pelas receitas publicadas, filtre por categoria e
          abra o passo a passo. Para gerenciar suas próprias receitas no modo demo, entre com{' '}
          <strong>cook / cook</strong>.
        </p>
      </section>
    </div>
  )
}
