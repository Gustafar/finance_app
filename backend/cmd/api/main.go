package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"finance_app/internal/database"
	"finance_app/internal/handlers"
	"finance_app/internal/middleware"
	"finance_app/internal/repositories"
	"finance_app/internal/services"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: não encontrou arquivo .env, usando variáveis do sistema")
	}

	db := database.Connect()
	defer db.Close()

	fmt.Println("Tudo certo, aplicação iniciada!")

	expenseRepo := repositories.NewExpenseRepository(db)
	recurringExpenseRepo := repositories.NewRecurringExpenseRepository(db)
	expenseService := services.NewExpenseService(expenseRepo, recurringExpenseRepo)
	expenseHandler := handlers.NewExpenseHandler(expenseService)

	recurringExpenseService := services.NewRecurringExpenseService(recurringExpenseRepo)
	recurringExpenseHandler := handlers.NewRecurringExpenseHandler(recurringExpenseService)

	categoryRepo := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryService)

	personRepo := repositories.NewPersonRepository(db)
	personService := services.NewPersonService(personRepo)
	personHandler := handlers.NewPersonHandler(personService)

	paymentMethodRepo := repositories.NewPaymentMethodRepository(db)
	paymentMethodService := services.NewPaymentMethodService(paymentMethodRepo)
	paymentMethodHandler := handlers.NewPaymentMethodHandler(paymentMethodService)

	bucketRepo := repositories.NewBucketRepository(db)
	bucketService := services.NewBucketService(bucketRepo)
	bucketHandler := handlers.NewBucketHandler(bucketService)

	bankRepo := repositories.NewBankRepository(db)
	bankService := services.NewBankService(bankRepo)
	bankHandler := handlers.NewBankHandler(bankService)

	investmentBoxRepo := repositories.NewInvestmentBoxRepository(db)
	investmentBoxService := services.NewInvestmentBoxService(investmentBoxRepo)
	investmentBoxHandler := handlers.NewInvestmentBoxHandler(investmentBoxService)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /auth/status", handlers.AuthStatus)
	mux.HandleFunc("POST /login", handlers.Login)

	mux.HandleFunc("GET /expenses", expenseHandler.GetAll)
	mux.HandleFunc("GET /expenses/{id}", expenseHandler.GetByID)
	mux.HandleFunc("POST /expenses", expenseHandler.Create)
	mux.HandleFunc("POST /expenses/installments", expenseHandler.CreateInstallments)
	mux.HandleFunc("POST /expenses/bulk", expenseHandler.CreateBulk)
	mux.HandleFunc("PUT /expenses/{id}", expenseHandler.Update)
	mux.HandleFunc("DELETE /expenses/{id}", expenseHandler.Delete)

	mux.HandleFunc("GET /recurring-expenses", recurringExpenseHandler.GetAll)
	mux.HandleFunc("GET /recurring-expenses/{id}", recurringExpenseHandler.GetByID)
	mux.HandleFunc("POST /recurring-expenses", recurringExpenseHandler.Create)
	mux.HandleFunc("POST /recurring-expenses/bulk", recurringExpenseHandler.CreateBulk)
	mux.HandleFunc("POST /recurring-expenses/generate-due", expenseHandler.GenerateDueRecurring)
	mux.HandleFunc("PUT /recurring-expenses/{id}", recurringExpenseHandler.Update)
	mux.HandleFunc("DELETE /recurring-expenses/{id}", recurringExpenseHandler.Delete)

	mux.HandleFunc("GET /categories", categoryHandler.GetAll)
	mux.HandleFunc("GET /categories/{id}", categoryHandler.GetByID)
	mux.HandleFunc("POST /categories", categoryHandler.Create)
	mux.HandleFunc("PUT /categories/{id}", categoryHandler.Update)
	mux.HandleFunc("DELETE /categories/{id}", categoryHandler.Delete)

	mux.HandleFunc("GET /people", personHandler.GetAll)
	mux.HandleFunc("GET /people/{id}", personHandler.GetByID)
	mux.HandleFunc("POST /people", personHandler.Create)
	mux.HandleFunc("PUT /people/{id}", personHandler.Update)
	mux.HandleFunc("DELETE /people/{id}", personHandler.Delete)

	mux.HandleFunc("GET /payment-methods", paymentMethodHandler.GetAll)
	mux.HandleFunc("GET /payment-methods/{id}", paymentMethodHandler.GetByID)
	mux.HandleFunc("POST /payment-methods", paymentMethodHandler.Create)
	mux.HandleFunc("PUT /payment-methods/{id}", paymentMethodHandler.Update)
	mux.HandleFunc("DELETE /payment-methods/{id}", paymentMethodHandler.Delete)

	mux.HandleFunc("GET /buckets", bucketHandler.GetAll)
	mux.HandleFunc("GET /buckets/{id}", bucketHandler.GetByID)
	mux.HandleFunc("POST /buckets", bucketHandler.Create)
	mux.HandleFunc("PUT /buckets/{id}", bucketHandler.Update)
	mux.HandleFunc("DELETE /buckets/{id}", bucketHandler.Delete)

	mux.HandleFunc("GET /banks", bankHandler.GetAll)
	mux.HandleFunc("GET /banks/{id}", bankHandler.GetByID)
	mux.HandleFunc("POST /banks", bankHandler.Create)
	mux.HandleFunc("PUT /banks/{id}", bankHandler.Update)
	mux.HandleFunc("DELETE /banks/{id}", bankHandler.Delete)

	mux.HandleFunc("GET /investment-boxes", investmentBoxHandler.GetAll)
	mux.HandleFunc("GET /investment-boxes/{id}", investmentBoxHandler.GetByID)
	mux.HandleFunc("POST /investment-boxes", investmentBoxHandler.Create)
	mux.HandleFunc("PUT /investment-boxes/{id}", investmentBoxHandler.Update)
	mux.HandleFunc("DELETE /investment-boxes/{id}", investmentBoxHandler.Delete)

	handler := middleware.Logging(middleware.CORS(middleware.RateLimit(middleware.RequireAuth(mux))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "9080"
	}

	fmt.Printf("Servidor rodando na porta %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
