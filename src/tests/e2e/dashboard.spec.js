
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
      cy.contains('Formação de Topo').should('be.visible')
      cy.contains('Análise Técnica').should('be.visible')
    })
  })

  it('deve permitir navegação entre páginas', () => {
    cy.contains('Análise de Compra/Venda').click()
    cy.url().should('include', '/analise-compra-venda')
    cy.contains('Análise de Compra/Venda').should('be.visible')
  })

  it('deve exibir o botão de ajuda', () => {
    cy.get('button[aria-label="Ajuda"]').should('be.visible')
  })

  it('deve redirecionar para a página inicial ao acessar rota inexistente', () => {
    cy.visit('/rota-inexistente')
    cy.url().should('not.include', '/rota-inexistente')
    cy.url().should('include', '/')
  })

  it('deve redirecionar para a página inicial ao tentar acessar posicao-carteira', () => {
    cy.visit('/posicao-carteira')
    cy.url().should('not.include', '/posicao-carteira')
    cy.url().should('include', '/')
  })

  it('não deve exibir links relacionados a carteira ou movimentação', () => {
    cy.contains('Carteira').should('not.exist')
    cy.contains('Movimentação').should('not.exist')
    cy.contains('Posição').should('not.exist')
  })
})
