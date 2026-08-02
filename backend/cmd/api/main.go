package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Usuario struct {
	Nome  string `json:"nome"`
	Idade int    `json:"idade"`
}

func handlerCriarUsuario(w http.ResponseWriter, r *http.Request) {
	var novoUsuario Usuario

	err := json.NewDecoder(r.Body).Decode(&novoUsuario)
	if err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	fmt.Println("Usuário recebido:", novoUsuario.Nome, novoUsuario.Idade)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(novoUsuario)
}

func main() {
	http.HandleFunc("/usuarios", handlerCriarUsuario)
	fmt.Println("Servidor rodando em http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
