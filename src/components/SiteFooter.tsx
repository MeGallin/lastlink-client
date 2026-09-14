export function SiteFooter() {
  return (
    <footer className="footer-note">
      <p>Station arrival only. Onward trains are not checked.</p>
      <p>
        Powered by the{' '}
        <a
          href="https://tfl.gov.uk/info-for/open-data-users/our-open-data"
          target="_blank"
          rel="noopener noreferrer"
        >
          Transport for London Journey Planner API
        </a>
        .
      </p>
    </footer>
  );
}
