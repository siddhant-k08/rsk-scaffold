import Link from "next/link";
import DiscordIcon from "~~/components/assets/DiscordIcon";
import GithubIcon from "~~/components/assets/GithubIcon";
import XIcon from "~~/components/assets/XIcon";

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      className="w-full grid md:flex justify-between items-center px-6 py-4 border-t-line text-sm"
      data-testid="footer-container"
    >
      <div className="order-2 mt-3 md:order-1">
        <div className="flex gap-2 items-center" data-testid="built-by-text">
          <span>Built by</span>
          <span className="text-lg font-bold">RootstockLabs</span>
        </div>
        <div className="text-xs text-gray-400" data-testid="copyright-text">
          Copyright &copy; {year} RootstockLabs. All rights reserved.
        </div>
      </div>
      <div className="flex gap-4 flex-wrap mt-3 order-1 md:order-2">
        <Link className="hover:underline" href="https://rootstock.io/" target="_blank" data-testid="about-link">
          About RootstockLabs
        </Link>
        <Link className="hover:underline" href="https://rootstock.io/contact/" target="_blank" data-testid="help-link">
          Help
        </Link>
        <Link
          className="hover:underline"
          href="https://rootstock.io/terms-conditions/"
          target="_blank"
          data-testid="term-cond-link"
        >
          Terms & Conditions
        </Link>
        <Link
          className="hover:underline"
          href="https://dev.rootstock.io/"
          target="_blank"
          data-testid="documentation-link"
        >
          Documentation
        </Link>
      </div>
      <div className="flex gap-4 mt-6 order-3">
        <Link href="https://twitter.com/rootstock_io" target="_blank" data-testid="twitter-icon">
          <XIcon />
        </Link>
        <Link href="https://github.com/rsksmart" target="_blank" data-testid="github-icon">
          <GithubIcon />
        </Link>
        <Link href="https://discord.com/invite/rootstock" target="_blank" data-testid="discord-icon">
          <DiscordIcon />
        </Link>
      </div>
    </footer>
  );
};
