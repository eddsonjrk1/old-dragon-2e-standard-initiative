# 🧠 Iniciativa Padrão para Old Dragon 2E

Este módulo substitui o sistema padrão de iniciativa do sistema **Old Dragon 2ª Edição** no Foundry VTT, aplicando uma lógica baseada em **teste de atributo** conforme a regra do LB1. O módulo realiza rolagens automáticas, classifica os combatentes e apresenta um **relatório visual em forma de tabela** no chat.

## 📦 Funcionalidades

✅ Substitui a fórmula padrão de iniciativa para `1d20`.

✅ Aplica a lógica: **1d20 contra o maior valor entre Destreza e Sabedoria**.

✅ Resultados:
- ✅ Sucesso: Iniciativa 99 (atua antes dos NPCs).
- ❌ Falha: Iniciativa 33 (atua depois dos NPCs).
- 👾 NPCs: Iniciativa 66 (posição intermediária).
- ⚠️ Atributos inválidos (DEX ou SAB zerados): Iniciativa 21.

✅ Rola automaticamente para combatentes sem iniciativa no início do combate.

✅ Permite que jogadores rolem manualmente, sem sobrescrever.

✅ Detecta e responde a **reset de iniciativa**, permitindo nova avaliação.

✅ Gera **tabela no chat** com todos os resultados, categorizados.

---

## 🧠 Como Funciona

Ao iniciar o combate:
1. O sistema verifica se é o **primeiro round**.
2. Para cada combatente:
   - Se for **NPC**, atribui iniciativa 66.
   - Se for **personagem**:
     - Usa o valor de `1d20` já rolado (manualmente ou automaticamente).
     - Compara com o maior valor entre `Destreza` e `Sabedoria`.
     - Atribui a iniciativa correspondente.
3. Exibe uma **tabela detalhada no chat** com todos os resultados.

O sistema também intercepta combatentes **adicionados após o início do combate**, aplicando a mesma lógica.

---

## 📘 Requisitos

- Foundry VTT v12+
- Sistema **Old Dragon 2ª Edição** (ID: `olddragon2e`)

---

## 📄 Licença

Este módulo é disponibilizado sob a licença [MIT](LICENSE). Sinta-se livre para modificar, distribuir ou adaptar conforme sua necessidade de mesa.

---

## ✉️ Contato

Dúvidas ou sugestões? Crie uma *issue* ou entre em contato com o autor diretamente.