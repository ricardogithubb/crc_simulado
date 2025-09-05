$(document).ready(function () {
    // Extrair disciplinas únicas
    let disciplines = [];

    // Variáveis de controle
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    let selectedDiscipline = null;
    let filteredQuestions = [];
    let questions = [];

    // Elementos do DOM
    const welcomeScreen = document.getElementById('welcome-screen');
    const disciplineScreen = document.getElementById('discipline-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const scoreScreen = document.getElementById('score-screen');
    const disciplineHeader = document.getElementById('discipline-header');
    const currentDisciplineName = document.getElementById('current-discipline-name');
    const disciplinesContainer = document.getElementById('disciplines-container');
    const welcomeStartButton = document.getElementById('welcome-start-button');
    const startButton = document.getElementById('start-button');
    const backButtonWelcome = document.getElementById('back-button-welcome');
    const backButton = document.getElementById('back-button');
    const questionTextElement = document.querySelector('.question-text');
    const optionElements = document.querySelectorAll('.option');
    const optionTextElements = document.querySelectorAll('.option-text');
    const nextButton = document.querySelector('.next-button');
    const currentQuestionElement = document.querySelector('.current-question');
    const totalQuestionsElement = document.querySelector('.total-questions');
    const questionContainer = document.querySelector('.question-container');
    const scoreValueElement = document.querySelector('.score-value');
    const restartButton = document.querySelector('.restart-button');

    // Inicializar o aplicativo
    async function init() {
        questions = await loadQuestionsArq(); // 🔹 esperar carregar o JSON
        console.log("Questões carregadas:", questions);

        // Garante que não tenta mapear se o arquivo está vazio
        if (!questions || questions.length === 0) {
            showAlert("Nenhuma questão encontrada no Banco de Dados!");
            return;
        }

        disciplines = [...new Set(questions.map(q => q.discipline))];
        renderDisciplineOptions();

        // Adicionar event listeners
        welcomeStartButton.addEventListener('click', showDisciplineScreen);
        startButton.addEventListener('click', startQuiz);
        backButtonWelcome.addEventListener('click', backToWelcomeScreen);
        backButton.addEventListener('click', backToDisciplineSelection);
        nextButton.addEventListener('click', nextQuestion);
        restartButton.addEventListener('click', restartQuiz);
    }

    // Mostrar tela de seleção de disciplina
    function showDisciplineScreen() {
        welcomeScreen.classList.add('hidden');
        disciplineScreen.classList.remove('hidden');
    }

    // Voltar para a tela inicial
    function backToWelcomeScreen() {
        disciplineScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
    }

    // Carregar múltiplos arquivos JSON com fallback local
    async function loadQuestionsArq() {
        const files = [
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2021_1.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2021_2.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2022_1.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2022_2.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2023_1.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2023_2.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2024_1.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2024_2.json',
            'https://ricardogithubb.github.io/crc_simulado/questions_crc_2025_1.json'
        ];

        try {
            // tenta buscar remoto
            const fetchPromises = files.map(file => 
                fetch(file).then(res => {
                    if (!res.ok) throw new Error(`Erro ao carregar ${file}`);
                    return res.json();
                })
            );
            const results = await Promise.all(fetchPromises);
            return results.flat();

        } catch (err) {
            console.warn("⚠️ Não conseguiu carregar do GitHub. Tentando local...", err);

            try {
                // fallback para arquivos locais
                const localFiles = [
                    'questions/questions_crc_2021_1.json',
                    'questions/questions_crc_2021_2.json',
                    'questions/questions_crc_2022_1.json',
                    'questions/questions_crc_2022_2.json',
                    'questions/questions_crc_2023_1.json',
                    'questions/questions_crc_2023_2.json',
                    'questions/questions_crc_2024_1.json',
                    'questions/questions_crc_2024_2.json',
                    'questions/questions_crc_2025_1.json'
                ];

                const localPromises = localFiles.map(file =>
                    fetch(file).then(res => {
                        if (!res.ok) throw new Error(`Erro ao carregar local ${file}`);
                        return res.json();
                    })
                );

                const resultsLocal = await Promise.all(localPromises);
                return resultsLocal.flat();

            } catch (localErr) {
                console.error("❌ Nem remoto, nem local funcionou.", localErr);
                return [];
            }
        }
    }


    // Renderizar opções de disciplina
    function renderDisciplineOptions() {
        disciplinesContainer.innerHTML = '';

        disciplines.forEach(discipline => {
            const optionElement = document.createElement('div');
            optionElement.className = 'discipline-option';
            optionElement.textContent = discipline;
            optionElement.addEventListener('click', () => selectDiscipline(discipline, optionElement));
            disciplinesContainer.appendChild(optionElement);
        });

        // Adicionar opção para todas as disciplinas
        const allOption = document.createElement('div');
        allOption.className = 'discipline-option';
        allOption.textContent = "Todas as Disciplinas";
        allOption.addEventListener('click', () => selectDiscipline(null, allOption));
        disciplinesContainer.appendChild(allOption);
    }

    // Selecionar disciplina
    function selectDiscipline(discipline, element) {
        // Remover seleção anterior
        document.querySelectorAll('.discipline-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Marcar como selecionado
        element.classList.add('selected');

        selectedDiscipline = discipline;
        startButton.disabled = false;
    }

    // Iniciar o quiz
    async function startQuiz() {
        const savedProgress = loadProgress(selectedDiscipline);

        if (savedProgress) {
            const continuar = await showConfirm("Você tem um progresso salvo nesta disciplina. Deseja continuar de onde parou?");
            
            if (continuar) {
                currentQuestionIndex = savedProgress.currentQuestionIndex;
                score = savedProgress.score;
                userAnswers = savedProgress.userAnswers;
                filteredQuestions = savedProgress.filteredQuestions;
            } else {
                clearProgress(selectedDiscipline);
                currentQuestionIndex = 0;
                score = 0;
                userAnswers = [];
                filteredQuestions = selectedDiscipline
                    ? questions.filter(q => q.discipline === selectedDiscipline)
                    : [...questions];
                shuffleArray(filteredQuestions);
            }
        } else {
            currentQuestionIndex = 0;
            score = 0;
            userAnswers = [];
            filteredQuestions = selectedDiscipline
                ? questions.filter(q => q.discipline === selectedDiscipline)
                : [...questions];
            shuffleArray(filteredQuestions);
        }

        if (filteredQuestions.length === 0) {
            alert('Não há questões disponíveis para a disciplina selecionada.');
            return;
        }

        totalQuestionsElement.textContent = `de ${filteredQuestions.length}`;
        disciplineHeader.classList.remove('hidden');
        currentDisciplineName.textContent = selectedDiscipline || "Todas as Disciplinas";

        disciplineScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');

        loadQuestion();

        optionElements.forEach(option => {
            option.addEventListener('click', selectOption);
        });
    }


    // Voltar para a seleção de disciplina
    function backToDisciplineSelection() {
        quizScreen.classList.add('hidden');
        scoreScreen.classList.add('hidden');
        disciplineHeader.classList.add('hidden');
        disciplineScreen.classList.remove('hidden');

        // Resetar variáveis
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        selectedDiscipline = null;
        filteredQuestions = [];
    }

    // Embaralhar array (algoritmo Fisher-Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); 
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }


    // Carregar questão atual
    function loadQuestion() {
        const currentQuestion = filteredQuestions[currentQuestionIndex];
        questionTextElement.textContent = currentQuestion.question;

        currentQuestionElement.textContent = `Questão ${currentQuestionIndex + 1}`;

        // Preencher opções
        optionTextElements[0].textContent = currentQuestion.options.A;
        optionTextElements[1].textContent = currentQuestion.options.B;
        optionTextElements[2].textContent = currentQuestion.options.C;
        optionTextElements[3].textContent = currentQuestion.options.D;

        // Resetar estilos das opções
        optionElements.forEach(option => {
            option.classList.remove('correct', 'incorrect');
            option.style.pointerEvents = 'auto';
        });

        // Esconder botão próximo
        nextButton.classList.add('hidden');
    }

    // Selecionar uma opção
    function selectOption(event) {
        const selectedOption = event.currentTarget;
        const selectedAnswer = selectedOption.getAttribute('data-option');
        const correctAnswer = filteredQuestions[currentQuestionIndex].correctAnswer;

        // Desabilitar clique em outras opções
        optionElements.forEach(option => {
            option.style.pointerEvents = 'none';

            if (option.getAttribute('data-option') === correctAnswer) {
                option.classList.add('correct');
            }
        });

        // Verificar se a resposta está correta
        if (selectedAnswer === correctAnswer) {
            selectedOption.classList.add('correct');
            score++;
        } else {
            selectedOption.classList.add('incorrect');
        }

        // Registrar resposta do usuário
        userAnswers[currentQuestionIndex] = {
            question: filteredQuestions[currentQuestionIndex].question,
            selected: selectedAnswer,
            correct: correctAnswer,
            isCorrect: selectedAnswer === correctAnswer
        };

        // Mostrar botão próximo
        nextButton.classList.remove('hidden');

        saveProgress(); // 🔹 salva após responder

    }

    // Próxima questão
    function nextQuestion() {
        currentQuestionIndex++;
        saveProgress(); // 🔹 salva ao avançar
        if (currentQuestionIndex < filteredQuestions.length) {
            loadQuestion();
        } else {
            showScore();
            clearProgress(selectedDiscipline); // limpa quando terminar
        }
    }

    // Mostrar pontuação final
    function showScore() {
        quizScreen.classList.add('hidden');
        disciplineHeader.classList.add('hidden');
        scoreScreen.classList.remove('hidden');
        scoreValueElement.textContent = `${score}/${filteredQuestions.length}`;
    }

    // Reiniciar o quiz
    function restartQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];

        scoreScreen.classList.add('hidden');
        disciplineScreen.classList.remove('hidden');

        // Embaralhar questões novamente
        shuffleArray(filteredQuestions);
    }


    // 🔹 Funções utilitárias para salvar e carregar progresso
    function saveProgress() {
        if (!selectedDiscipline) return;

        const progress = {
            discipline: selectedDiscipline,
            currentQuestionIndex,
            score,
            userAnswers,
            filteredQuestions
        };

        localStorage.setItem(`progress_${selectedDiscipline || "all"}`, JSON.stringify(progress));
    }

    function loadProgress(discipline) {
        const data = localStorage.getItem(`progress_${discipline || "all"}`);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    }

    function clearProgress(discipline) {
        localStorage.removeItem(`progress_${discipline || "all"}`);
    }

    // 🔹 Função para mostrar alerta simples
    function showAlert(message, title = "Aviso") {
        return new Promise((resolve) => {
            const modal = new bootstrap.Modal(document.getElementById('appModal'));
            document.getElementById('appModalLabel').textContent = title;
            document.getElementById('appModalBody').textContent = message;

            const footer = document.getElementById('appModalFooter');
            footer.innerHTML = `
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
            `;

            document.getElementById('appModal').addEventListener('hidden.bs.modal', () => {
                resolve(true);
            }, { once: true });

            modal.show();
        });
    }

    // 🔹 Função para mostrar confirmação (Sim / Não)
    function showConfirm(message, title = "Confirmação") {
        return new Promise((resolve) => {
            const modal = new bootstrap.Modal(document.getElementById('appModal'));
            document.getElementById('appModalLabel').textContent = title;
            document.getElementById('appModalBody').textContent = message;

            const footer = document.getElementById('appModalFooter');
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Não</button>
                <button type="button" class="btn btn-primary" id="modalYesBtn">Sim</button>
            `;

            footer.querySelector("#modalYesBtn").addEventListener("click", () => {
                modal.hide();
                resolve(true);
            });

            document.getElementById('appModal').addEventListener('hidden.bs.modal', () => {
                resolve(false);
            }, { once: true });

            modal.show();
        });
    }


    // Iniciar o aplicativo quando a página carregar
    window.addEventListener('load', init);
});