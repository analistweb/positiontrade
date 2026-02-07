import React from 'react';
import { Link } from 'react-router-dom';
import { navItems } from '@/nav-items';
import { Activity, ExternalLink } from 'lucide-react';
export const EditorialFooter = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="bg-background-alt border-t border-border">
      <div className="editorial-container py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 min-h-0 min-w-0">
              <span className="font-serif text-xl font-bold text-foreground">Positiontrade
            </span>
            </Link>
            <p className="mt-4 text-sm text-foreground-subtle leading-relaxed">
              Análise profissional de criptomoedas com dados em tempo real, 
              indicadores técnicos avançados e monitoramento de baleias.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="flex items-center gap-1.5 text-xs text-success">
                <Activity className="w-3 h-3 animate-pulse" />
                Sistema operacional
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Navegação
            </h4>
            <ul className="space-y-2">
              {navItems.slice(0, 4).map(({
              title,
              to
            }) => <li key={to}>
                  <Link to={to} className="text-sm text-foreground-subtle hover:text-foreground transition-colors min-h-0 min-w-0 inline-block">
                    {title}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* More Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Ferramentas
            </h4>
            <ul className="space-y-2">
              {navItems.slice(4).map(({
              title,
              to
            }) => <li key={to}>
                  <Link to={to} className="text-sm text-foreground-subtle hover:text-foreground transition-colors min-h-0 min-w-0 inline-block">
                    {title}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Fontes de Dados
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-foreground transition-colors min-h-0 min-w-0">
                  CoinGecko
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-foreground transition-colors min-h-0 min-w-0">
                  Binance
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.cryptocompare.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-foreground-subtle hover:text-foreground transition-colors min-h-0 min-w-0">
                  CryptoCompare
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-foreground-subtle">
              © {currentYear} CryptoAnalytics. Todos os direitos reservados.
            </p>
            <p className="text-xs text-foreground-subtle">
              Dados atualizados em tempo real. Não constitui aconselhamento financeiro.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};
export default EditorialFooter;