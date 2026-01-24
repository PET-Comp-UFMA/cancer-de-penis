import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { RadioGroup, Radio, FormControlLabel } from "@mui/material";

// Tipo das respostas: boolean (Sim/Não) ou number (1 a 5)
export type TipoResposta = "boolean" | "number";

interface FormQuestionarioProps {
  nome: string;
  perguntas: string[];
  tipoResposta: TipoResposta;
}

export default function FormQuestionario({ nome, perguntas, tipoResposta}: FormQuestionarioProps) {
    const [index, setIndex] = useState(0)
    const [respostas, setRespostas] = useState<(boolean | number)[]>(Array(perguntas.length).fill(null))
    const [finalizado, setFinalizado] = useState(false)
    const [respostaSelecionada, setRespostaSelecionada] = useState<boolean | number | null>(null);

    const handlerProxima = (resposta: number | boolean) => {
        const novas = [...respostas];
        novas[index] = resposta;
        setRespostas(novas);
        setRespostaSelecionada(respostas[index+1]);
        // só avança se não for a última
        if (index < perguntas.length - 1) {
            setIndex(index + 1);
        }
    };

    const handlerAnterior = () => {
        const anterior = index - 1;
        setRespostaSelecionada(respostas[anterior]);
        setIndex(anterior);
    }

    const enviar = async (dadosFinais: (number | boolean)[]) => {
        await fetch('/api/respostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dadosFinais }),
        });
        alert('Respostas enviadas com sucesso! Respostas: ' + JSON.stringify({dadosFinais}));
    };

    const handlerFinalizar = (resposta: number | boolean) => {
        const novas = [...respostas];
        novas[index] = resposta;
        setRespostas(novas);
        enviar(novas)
    }

    if (finalizado) {
        return "Resultados";
    }

    return (
        <>
            {/* Título do formulário */}
            <Typography variant="h1" sx={{
              textAlign: "center",
              fontSize: 46,
              fontWeight: 800,
              color: "#1F6C75",
              mb: 5,
            }}>
                {"Questionário " + nome}
            </Typography>

            {/* Progresso das perguntas */}
            <Box
                sx={{
                    maxWidth: 700,
                    mx: "auto",   // centraliza o bloco na página
                    textAlign: "left",
                }}
            >
                {/* Progresso das perguntas */}
                <Box sx={{ display: "flex", alignItems: "center", width: "100%",gap: 1, mb: 2, mt:1 }}>
                    {perguntas.map((_, i) => {
                        const isCurrent = i === index;
                        const isLast = i === perguntas.length - 1;
                        const showLarge = isCurrent || isLast;

                        return (
                            <Box
                                key={i}
                                sx={{
                                    width: showLarge ? 25 : 6,
                                    height: showLarge ? 25 : 6,
                                    borderRadius: "50%",
                                    border: "1px solid #0A6C74",
                                    backgroundColor: isCurrent ? "#0A6C74" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: isLast && !isCurrent ? "#0A6C74" : "#fff",
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                            >
                                {showLarge ? i + 1 : ""}
                            </Box>
                        );
                    })}
                </Box>
                
                {/* Número da pergunta*/}
                <Typography sx={{ fontSize: 24, color: "#0A6C74", mb: 5, py:2, fontWeight: 700}}>
                    {index+1 + "."}
                </Typography>

                {/* Pergunta */}
                <Typography sx={{ fontSize: 24, color: "#0F3C3E", mb: 5, mt:-6, width:600 }}>
                    {perguntas[index]}
                </Typography>

                {/* Caixa com a opção dentro */}
                
                {
                    tipoResposta == "boolean" && (
                    <Box
                        sx={{
                            bgcolor: "#F0F5F6",   // cinza claro
                            p: 3,                  // padding interno
                            borderRadius: 2,       // cantos arredondados
                            minHeight: 100,        // altura mínima
                            mb: 5
                        }}
                    >
                        <RadioGroup
                            value={respostaSelecionada}
                            onChange={(e) => setRespostaSelecionada(e.target.value == "true")}
                        >
                        <FormControlLabel value="true" control={<Radio sx = {{'&.Mui-checked':{color: "#0A6C74"}}}/>} label="Sim" />
                        <FormControlLabel value="false" control={<Radio sx = {{'&.Mui-checked':{color: "#0A6C74"}}}/>} label="Não" />
                        </RadioGroup>
                    </Box>
                    )
                }

                {
                    tipoResposta == "number" && (
                        "Teste"
                    )
                }

                <Box sx = {{display: "flex", justifyContent:"space-between"}}>
                    <Box sx = {{ display:"flex", flexDirection:"row" }}>
                        {/* Gera botão de anterior se a pergunta atual não for a primeira */}
                        {
                            index > 0 && (
                                <Button
                                    variant="contained"
                                    sx={{bgcolor: "#0A6C74", mr: 2, borderRadius: 2}}
                                    onClick={() => handlerAnterior()}
                                >
                                    Anterior
                                </Button>
                            )
                        }

                        {/* Gera botão de próximo se a pergunta atual não for a última */}
                        {
                            index < perguntas.length-1 && (
                                <Button
                                    variant="contained"
                                    sx={{bgcolor: "#0A6C74", mr: 2, borderRadius: 2}}
                                    onClick={() => handlerProxima(respostaSelecionada!)}
                                    disabled={respostaSelecionada === null}
                                >
                                    Próximo
                                </Button>
                            )
                        }

                        {/* Gera botão de finalizar se a pergunta atual for a última */}
                        {
                            index == perguntas.length-1 && (
                                <Button
                                    variant="contained"
                                    sx={{bgcolor: "#0A6C74", mr: 2, borderRadius: 2}}
                                    onClick={() => handlerFinalizar(respostaSelecionada!)}
                                    disabled={respostaSelecionada == null}
                                >
                                    Finalizar
                                </Button>
                            )
                        }
                    </Box>
                    
                    
                    <Button
                        variant="contained"
                        sx={{bgcolor: "#0A6C74", mr: 2, borderRadius: 2}}
                    >
                        Cancelar
                    </Button>

                </Box>

                
                
            </Box>

            
        </>
    )
}