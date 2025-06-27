class MinHeap {
    constructor() {
        this.heap = [];
    }

    pai(indice) {
        return Math.floor((indice - 1) / 2);
    }

    filhoEsquerdo(indice) {
        return 2 * indice + 1;
    }

    filhoDireito(indice) {
        return 2 * indice + 2;
    }

    trocar(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    inserir(no) {
        this.heap.push(no);
        this.ajustarParaCima(this.heap.length - 1);
    }

    ajustarParaCima(indice) {
        while (indice > 0 && this.heap[this.pai(indice)].custo > this.heap[indice].custo) {
            this.trocar(this.pai(indice), indice);
            indice = this.pai(indice);
        }
    }

    extrairMinimo() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const minimo = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.ajustarParaBaixo(0);
        return minimo;
    }

    ajustarParaBaixo(indice) {
        let menor = indice;
        const esquerda = this.filhoEsquerdo(indice);
        const direita = this.filhoDireito(indice);

        if (esquerda < this.heap.length && this.heap[esquerda].custo < this.heap[menor].custo) {
            menor = esquerda;
        }

        if (direita < this.heap.length && this.heap[direita].custo < this.heap[menor].custo) {
            menor = direita;
        }

        if (menor !== indice) {
            this.trocar(indice, menor);
            this.ajustarParaBaixo(menor);
        }
    }

    estaVazio() {
        return this.heap.length === 0;
    }
}

class Grafo {
    constructor() {
        this.listaAdjacencia = new Map();
        this.pedagios = new Map();
    }

    carregarDeObjeto(dadosCapitais) {
        dadosCapitais.forEach(cidadeObj => {
            const nomeCidade = Object.keys(cidadeObj)[0];
            const dadosCidade = cidadeObj[nomeCidade];

            if (!this.listaAdjacencia.has(nomeCidade)) {
                this.listaAdjacencia.set(nomeCidade, []);
            }

            this.pedagios.set(nomeCidade, dadosCidade.toll);

            Object.entries(dadosCidade.neighbors).forEach(([vizinho, distancia]) => {
                this.listaAdjacencia.get(nomeCidade).push({ cidade: vizinho, distancia });

                if (!this.listaAdjacencia.has(vizinho)) {
                    this.listaAdjacencia.set(vizinho, []);
                }
            });
        });
    }

    mostrar() {
        console.log('\n=== GRAFO DE CAPITAIS ===');
        for (const [cidade, vizinhos] of this.listaAdjacencia) {
            const pedagio = this.pedagios.get(cidade) || 0;
            console.log(`\n${cidade} (Pedágio: R$ ${pedagio})`);

            if (vizinhos.length === 0) {
                console.log('  -> Sem conexões');
            } else {
                vizinhos.forEach(vizinho => {
                    console.log(`  -> ${vizinho.cidade}: ${vizinho.distancia} km`);
                });
            }
        }
        console.log('\n========================\n');
    }

    dijkstra(origem, destino, precoCombustivel, autonomiaKmL) {
        if (!this.listaAdjacencia.has(origem) || !this.listaAdjacencia.has(destino)) {
            return { sucesso: false, mensagem: 'Capital de origem ou destino não encontrada!' };
        }

        const distancias = new Map();
        const anteriores = new Map();
        const visitados = new Set();
        const heap = new MinHeap();

        for (const cidade of this.listaAdjacencia.keys()) {
            distancias.set(cidade, Infinity);
            anteriores.set(cidade, null);
        }

        distancias.set(origem, 0);
        heap.inserir({ cidade: origem, custo: 0 });

        while (!heap.estaVazio()) {
            const atual = heap.extrairMinimo();

            if (visitados.has(atual.cidade)) continue;
            visitados.add(atual.cidade);

            if (atual.cidade === destino) break;

            const vizinhos = this.listaAdjacencia.get(atual.cidade) || [];

            for (const vizinho of vizinhos) {
                if (visitados.has(vizinho.cidade)) continue;

                const distanciaKm = vizinho.distancia;
                const custoCombustivel = (distanciaKm / autonomiaKmL) * precoCombustivel;

                let custoPedagio = 0;
                if (vizinho.cidade !== destino) {
                    custoPedagio = this.pedagios.get(vizinho.cidade) || 0;
                }

                const custoTotal = custoCombustivel + custoPedagio;

                const novaDistancia = distancias.get(atual.cidade) + custoTotal;

                if (novaDistancia < distancias.get(vizinho.cidade)) {
                    distancias.set(vizinho.cidade, novaDistancia);
                    anteriores.set(vizinho.cidade, atual.cidade);
                    heap.inserir({ cidade: vizinho.cidade, custo: novaDistancia });
                }
            }
        }

        if (distancias.get(destino) === Infinity) {
            return { sucesso: false, mensagem: 'Não existe rota entre as capitais selecionadas!' };
        }

        const caminho = [];
        let atual = destino;

        while (atual !== null) {
            caminho.unshift(atual);
            atual = anteriores.get(atual);
        }

        const detalhes = this.calcularDetalhesRota(caminho, precoCombustivel, autonomiaKmL);

        return {
            sucesso: true,
            rota: caminho,
            custoTotal: distancias.get(destino),
            detalhes
        };
    }

    calcularDetalhesRota(caminho, precoCombustivel, autonomiaKmL) {
        const detalhes = [];
        let distanciaTotal = 0;
        let custoTotalCombustivel = 0;
        let custoTotalPedagios = 0;

        for (let i = 0; i < caminho.length - 1; i++) {
            const de = caminho[i];
            const para = caminho[i + 1];

            const vizinhos = this.listaAdjacencia.get(de) || [];
            const vizinho = vizinhos.find(n => n.cidade === para);

            if (vizinho) {
                const distancia = vizinho.distancia;
                const custoCombustivel = (distancia / autonomiaKmL) * precoCombustivel;
                let custoPedagio = 0;
                if (i < caminho.length - 2) {
                    custoPedagio = this.pedagios.get(para) || 0;
                }
                detalhes.push({
                    de,
                    para,
                    distancia,
                    custoCombustivel,
                    custoPedagio,
                    custoTrecho: custoCombustivel + custoPedagio
                });

                distanciaTotal += distancia;
                custoTotalCombustivel += custoCombustivel;
                custoTotalPedagios += custoPedagio;
            }
        }

        return {
            trechos: detalhes,
            resumo: {
                distanciaTotal,
                custoTotalCombustivel,
                custoTotalPedagios,
                custoTotal: custoTotalCombustivel + custoTotalPedagios
            }
        };
    }

    listarCapitais() {
        return Array.from(this.listaAdjacencia.keys()).sort();
    }

    buscarCaminhoMaisBarato(origem, destino, precoCombustivel, autonomiaKmL, containerResultados) {
        let html = '';

        html += `<h5>Busca Caminho Mais Barato</h5>`;
        html += `<p><strong>Origem:</strong> ${origem}</p>`;
        html += `<p><strong>Destino:</strong> ${destino}</p>`;
        html += `<p><strong>Preço do Combustível:</strong> R$ ${precoCombustivel.toFixed(2)}/L</p>`;
        html += `<p><strong>Autonomia:</strong> ${autonomiaKmL} km/L</p>`;
        html += `<hr>`;

        const resultado = this.dijkstra(origem, destino, precoCombustivel, autonomiaKmL);

        if (resultado.sucesso) {
            html += `<h6>Rota Encontrada</h6>`;
            html += `<p><strong>Caminho:</strong> ${resultado.rota.join(' → ')}</p>`;
            html += `<p><strong>Custo Total:</strong> R$ ${resultado.custoTotal.toFixed(2)}</p>`;
            html += `<hr><h6>Detalhes do Trajeto</h6>`;

            resultado.detalhes.trechos.forEach((trecho, i) => {
                html += `<div class="text-start mb-2">`;
                html += `<strong>${i + 1}. ${trecho.de} → ${trecho.para}</strong><br>`;
                html += `Distância: ${trecho.distancia} km<br>`;
                html += `Combustível: R$ ${trecho.custoCombustivel.toFixed(2)}<br>`;
                html += `Pedágio: R$ ${trecho.custoPedagio.toFixed(2)}<br>`;
                html += `<strong>Subtotal:</strong> R$ ${trecho.custoTrecho.toFixed(2)}`;
                html += `</div>`;
            });

            html += `<hr><h6>Resumo</h6>`;
            html += `<p><strong>Distância Total:</strong> ${resultado.detalhes.resumo.distanciaTotal} km</p>`;
            html += `<p><strong>Gasto com Combustível:</strong> R$ ${resultado.detalhes.resumo.custoTotalCombustivel.toFixed(2)}</p>`;
            html += `<p><strong>Gasto com Pedágios:</strong> R$ ${resultado.detalhes.resumo.custoTotalPedagios.toFixed(2)}</p>`;
            html += `<p><strong>TOTAL:</strong> R$ ${resultado.detalhes.resumo.custoTotal.toFixed(2)}</p>`;
        } else {
            html += `<p class="text-danger"><strong>Erro:</strong> ${resultado.mensagem}</p>`;
        }

        containerResultados.innerHTML = html;

        return resultado;
    }
}

async function carregarCapitais() {
    try {
        const response = await fetch('capitais.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const capitaisData = await response.json();
        return capitaisData;
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    const capitaisData = await carregarCapitais();

    const grafo = new Grafo();
    grafo.carregarDeObjeto(capitaisData);

    const selectOrigem = document.getElementById('selectOrigem');
    const selectDestino = document.getElementById('selectDestino');
    const valorCombustivel = document.getElementById('valorCombustivel');
    const autonomia = document.getElementById('autonomia');
    const btnCalcular = document.getElementById('btnCalcular');

    const capitais = grafo.listarCapitais();

    capitais.forEach(cidade => {
        const optOrigem = document.createElement('option');
        optOrigem.value = cidade;
        optOrigem.textContent = cidade;
        selectOrigem.appendChild(optOrigem);

        const optDestino = document.createElement('option');
        optDestino.value = cidade;
        optDestino.textContent = cidade;
        selectDestino.appendChild(optDestino);
    });


    btnCalcular.addEventListener('click', () => {
        const origem = selectOrigem.value;
        const destino = selectDestino.value;
        const precoCombustivel = valorCombustivel.value;
        const autonomiaKml = autonomia.value;
        const containerResultados = document.getElementById('results');

        if (!origem || !destino) {
            containerResultados.innerHTML = '<p class="error">Por favor, selecione as capitais de origem e destino.</p>';
            return;
        }

        if (origem === destino) {
            containerResultados.innerHTML = '<p class="info">As capitais de origem e destino são as mesmas.</p>';
            return;
        }

        if (!precoCombustivel) {
            containerResultados.innerHTML = '<p class="error">Por favor, informe o preço do combustível.</p>';
            return;
        }

        if (precoCombustivel < 0) {
            containerResultados.innerHTML = '<p class="error">O preço do combustível deve ser maior que zero.</p>';
            return;
        }

        if (!autonomiaKml) {
            containerResultados.innerHTML = '<p class="error">Por favor, informe a autonomia do veículo.</p>';
            return;
        }

        if (autonomiaKml < 0) {
            containerResultados.innerHTML = '<p class="error">A autonomia do veículo deve ser maior que zero.</p>';
            return;
        }

        grafo.buscarCaminhoMaisBarato(origem, destino, parseFloat(precoCombustivel), parseFloat(autonomiaKml), containerResultados);
    });
});