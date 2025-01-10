describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the dashboard successfully', () => {
    cy.get('[data-testid="market-heatmap"]').should('exist');
    cy.get('[data-testid="market-sentiment"]').should('exist');
    cy.get('[data-testid="cbbi-indicator"]').should('exist');
  });

  it('should display market data correctly', () => {
    cy.get('[data-testid="market-stats"]').within(() => {
      cy.get('[data-testid="btc-price"]').should('exist');
      cy.get('[data-testid="market-cap"]').should('exist');
      cy.get('[data-testid="volume"]').should('exist');
    });
  });
});