describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.visit('/')
    // Aguardar carregamento inicial
    cy.get('h1').should('be.visible')
  })

  it('deve carregar o dashboard com sucesso', () => {
    cy.contains('Análise de Criptomoedas').should('be.visible')
    cy.get('nav').should('be.visible')
  })

  it('deve exibir o menu de navegação', () => {
    cy.get('nav').within(() => {
      cy.contains('Painel').should('be.visible')
      cy.contains('Análise de Compra/Venda').should('be.visible')
      cy.contains('Posição da Carteira').should('be.visible')
    })
  })

  it('deve permitir navegação entre páginas', () => {
    cy.contains('Posição da Carteira').click()
    cy.url().should('include', '/portfolio')
    cy.contains('Seu Portfólio').should('be.visible')
  })

  it('deve exibir o botão de ajuda', () => {
    cy.get('button[aria-label="Ajuda"]').should('be.visible')
  })
})