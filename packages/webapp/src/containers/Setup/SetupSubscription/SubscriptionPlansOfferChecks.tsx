import styles from './SubscriptionPlansOfferChecks.module.scss';

export function SubscriptionPlansOfferChecks() {
  return (
    <div className={styles.container}>
      <span className={styles.iconText}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          width="18px"
          viewBox="0 -960 960 960"
          fill="rgb(0, 130, 77)"
          className={styles.icon}
        >
          <path d="M378-225 133-470l66-66 179 180 382-382 66 65-448 448Z"></path>
        </svg>
        Prueba gratuita de 14 días
      </span>

      <span className={styles.iconText}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          width="18px"
          viewBox="0 -960 960 960"
          fill="rgb(0, 130, 77)"
          className={styles.icon}
        >
          <path d="M378-225 133-470l66-66 179 180 382-382 66 65-448 448Z"></path>
        </svg>
        Soporte en línea 24/7
      </span>
    </div>
  );
}
