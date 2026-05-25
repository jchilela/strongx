import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Termos de Serviço — StrongX',
  description: 'Termos de Serviço e Política de Privacidade da plataforma StrongX.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="StrongX" width={120} height={69} className="object-contain" />
          </Link>
          <Link href="/login" className="text-sm text-indigo-600 hover:underline">
            Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Serviço</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualização: Maio de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Definições</h2>
            <p>Para efeitos dos presentes Termos de Serviço, entende-se por:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Plataforma</strong>: o serviço StrongX, acessível em strongx.it.ao, que permite o envio de mensagens SMS, Email e WhatsApp em massa ou individuais.</li>
              <li><strong>Utilizador</strong>: qualquer pessoa singular ou colectiva que crie uma conta e utilize a Plataforma.</li>
              <li><strong>Carteira</strong>: saldo virtual em Kwanzas (AOA) associado à conta do Utilizador, utilizado para debitar o custo dos serviços.</li>
              <li><strong>Aplicação</strong>: projecto criado pelo Utilizador na Plataforma para organizar o envio de mensagens.</li>
              <li><strong>StrongX</strong>: entidade responsável pela operação da Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Aceitação dos Termos</h2>
            <p>Ao criar uma conta na Plataforma, o Utilizador declara ter lido, compreendido e aceite integralmente os presentes Termos de Serviço. Caso não concorde com alguma das condições aqui estabelecidas, deve abster-se de utilizar a Plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Descrição do Serviço</h2>
            <p>A StrongX disponibiliza uma plataforma de comunicação que permite:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Envio de mensagens SMS para números de telefone angolanos e internacionais;</li>
              <li>Envio de emails individuais e em massa;</li>
              <li>Envio de mensagens via WhatsApp;</li>
              <li>Gestão de aplicações e chaves API para integração de terceiros;</li>
              <li>Carregamento de saldo via Multicaixa Express (GPO) ou referência Multicaixa (ATM).</li>
            </ul>
            <p className="mt-2">Os canais de Email e WhatsApp poderão estar sujeitos a disponibilidade e activação prévia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Registo e Conta</h2>
            <p>O Utilizador deve fornecer informações verdadeiras, completas e actualizadas no momento do registo. É obrigatória a verificação do número de telefone e do endereço de email antes de aceder à Plataforma.</p>
            <p className="mt-2">O Utilizador é responsável por manter a confidencialidade das suas credenciais de acesso e por todas as actividades realizadas na sua conta.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Pagamentos e Carteira</h2>
            <p>O saldo da Carteira é pré-pago e não reembolsável, salvo em casos expressamente previstos pela StrongX. O saldo é debitado automaticamente aquando do envio de mensagens, de acordo com a tabela de preços em vigor.</p>
            <p className="mt-2">As referências Multicaixa têm validade de 48 horas. Após expiração, o carregamento não será processado. O Utilizador deve efectuar novo pedido de referência se necessário.</p>
            <p className="mt-2">A StrongX reserva-se o direito de alterar os preços dos serviços, mediante notificação prévia de 30 dias ao Utilizador.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Utilização Aceitável</h2>
            <p>O Utilizador compromete-se a utilizar a Plataforma de forma lícita e responsável. É expressamente proibido:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Enviar mensagens não solicitadas (spam) ou enganosas;</li>
              <li>Utilizar a Plataforma para fins ilegais, fraudulentos ou prejudiciais a terceiros;</li>
              <li>Enviar conteúdo que viole direitos de terceiros, incluindo direitos de autor e privacidade;</li>
              <li>Tentar aceder a contas ou dados de outros utilizadores;</li>
              <li>Sobrecarregar deliberadamente a infraestrutura da Plataforma;</li>
              <li>Enviar mensagens com conteúdo pornográfico, violento, racista ou discriminatório.</li>
            </ul>
            <p className="mt-2">A violação destas regras pode resultar na suspensão imediata da conta, sem direito a reembolso do saldo.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Aprovação de Aplicações</h2>
            <p>As aplicações criadas na Plataforma estão sujeitas a aprovação pela equipa da StrongX. A StrongX reserva-se o direito de recusar ou revogar a aprovação de qualquer aplicação que não cumpra os presentes Termos ou as políticas dos fornecedores de comunicação.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Limitação de Responsabilidade</h2>
            <p>A StrongX não garante a entrega de 100% das mensagens, uma vez que a entrega final depende de operadores de telecomunicações e outras entidades externas. Não nos responsabilizamos por atrasos, falhas de entrega ou indisponibilidade dos serviços de terceiros.</p>
            <p className="mt-2">Em nenhuma circunstância a responsabilidade total da StrongX perante o Utilizador excederá o valor do saldo disponível na Carteira do Utilizador no momento do incidente.</p>
          </section>

          <section id="privacidade">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Política de Privacidade</h2>
            <p>A StrongX recolhe e trata os dados pessoais dos Utilizadores (nome, email, número de telefone) exclusivamente para fins de prestação do serviço, verificação de identidade, processamento de pagamentos e comunicações relacionadas com a conta.</p>
            <p className="mt-2">Os dados não são vendidos ou partilhados com terceiros para fins comerciais. Poderão ser partilhados com fornecedores de serviços (operadoras de SMS, processadores de pagamento) estritamente para execução do serviço contratado.</p>
            <p className="mt-2">O Utilizador tem o direito de aceder, rectificar ou eliminar os seus dados pessoais contactando o suporte em <a href="mailto:suporte@strongx.it.ao" className="text-indigo-600 hover:underline">suporte@strongx.it.ao</a>.</p>
            <p className="mt-2">Os dados são conservados pelo período necessário à prestação do serviço e obrigações legais, não excedendo 5 anos após o encerramento da conta.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Alterações aos Termos</h2>
            <p>A StrongX reserva-se o direito de actualizar os presentes Termos a qualquer momento. As alterações serão comunicadas ao Utilizador por email ou notificação na Plataforma com antecedência mínima de 15 dias. A continuação da utilização da Plataforma após esse período implica a aceitação dos novos Termos.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Lei Aplicável e Jurisdição</h2>
            <p>Os presentes Termos são regidos pela lei angolana. Qualquer litígio será submetido à jurisdição exclusiva dos tribunais de Luanda, Angola.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contactos</h2>
            <p>Para questões relacionadas com estes Termos ou com a utilização da Plataforma, contacte-nos através de:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Email: <a href="mailto:suporte@strongx.it.ao" className="text-indigo-600 hover:underline">suporte@strongx.it.ao</a></li>
              <li>Website: <a href="https://strongx.it.ao" className="text-indigo-600 hover:underline">strongx.it.ao</a></li>
            </ul>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12 py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} StrongX. Todos os direitos reservados.</span>
          <Link href="/login" className="hover:text-gray-600">Entrar na plataforma</Link>
        </div>
      </footer>
    </div>
  );
}
