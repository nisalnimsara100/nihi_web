export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      Account: {
        Row: {
          archived: boolean
          annualFee: number | null
          creditLimit: number | null
          dueDay: number | null
          interestRate: number | null
          lateFee: number | null
          minPaymentFloor: number
          minPaymentPercent: number
          statementDay: number | null
          color: string
          createdAt: string
          currency: string
          id: string
          initialBalance: number
          name: string
          note: string
          sortOrder: number
          theme: string
          type: Database["public"]["Enums"]["AccountType"]
          userId: string
        }
        Insert: {
          archived?: boolean
          annualFee?: number | null
          creditLimit?: number | null
          dueDay?: number | null
          interestRate?: number | null
          lateFee?: number | null
          minPaymentFloor?: number
          minPaymentPercent?: number
          statementDay?: number | null
          color: string
          createdAt?: string
          currency: string
          id?: string
          initialBalance?: number
          name: string
          note?: string
          sortOrder?: number
          theme?: string
          type?: Database["public"]["Enums"]["AccountType"]
          userId: string
        }
        Update: {
          archived?: boolean
          annualFee?: number | null
          creditLimit?: number | null
          dueDay?: number | null
          interestRate?: number | null
          lateFee?: number | null
          minPaymentFloor?: number
          minPaymentPercent?: number
          statementDay?: number | null
          color?: string
          createdAt?: string
          currency?: string
          id?: string
          initialBalance?: number
          name?: string
          note?: string
          sortOrder?: number
          theme?: string
          type?: Database["public"]["Enums"]["AccountType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Card: {
        Row: {
          accountId: string
          createdAt: string
          id: string
          last4: string
          name: string
          network: string
          userId: string
        }
        Insert: {
          accountId: string
          createdAt?: string
          id?: string
          last4: string
          name?: string
          network?: string
          userId: string
        }
        Update: {
          accountId?: string
          createdAt?: string
          id?: string
          last4?: string
          name?: string
          network?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Card_accountId_fkey"
            columns: ["accountId"]
            isOneToOne: false
            referencedRelation: "Account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Card_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Category: {
        Row: {
          color: string
          createdAt: string
          icon: string
          id: string
          name: string
          type: Database["public"]["Enums"]["CategoryType"]
          userId: string
        }
        Insert: {
          color: string
          createdAt?: string
          icon?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["CategoryType"]
          userId: string
        }
        Update: {
          color?: string
          createdAt?: string
          icon?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["CategoryType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Category_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PartnerShare: {
        Row: {
          acceptedAt: string | null
          createdAt: string
          email: string
          id: string
          ownerId: string
          partnerId: string | null
          token: string
        }
        Insert: {
          acceptedAt?: string | null
          createdAt?: string
          email: string
          id?: string
          ownerId: string
          partnerId?: string | null
          token: string
        }
        Update: {
          acceptedAt?: string | null
          createdAt?: string
          email?: string
          id?: string
          ownerId?: string
          partnerId?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "PartnerShare_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PartnerShare_partnerId_fkey"
            columns: ["partnerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Tag: {
        Row: {
          color: string
          createdAt: string
          id: string
          name: string
          userId: string
        }
        Insert: {
          color: string
          createdAt?: string
          id?: string
          name: string
          userId: string
        }
        Update: {
          color?: string
          createdAt?: string
          id?: string
          name?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Tag_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Transaction: {
        Row: {
          accountId: string
          amount: number
          cardId: string | null
          categoryId: string | null
          createdAt: string
          date: string
          id: string
          note: string
          toAccountId: string | null
          toAmount: number | null
          type: Database["public"]["Enums"]["TransactionType"]
          userId: string
        }
        Insert: {
          accountId: string
          amount: number
          cardId?: string | null
          categoryId?: string | null
          createdAt?: string
          date: string
          id?: string
          note?: string
          toAccountId?: string | null
          toAmount?: number | null
          type: Database["public"]["Enums"]["TransactionType"]
          userId: string
        }
        Update: {
          accountId?: string
          amount?: number
          cardId?: string | null
          categoryId?: string | null
          createdAt?: string
          date?: string
          id?: string
          note?: string
          toAccountId?: string | null
          toAmount?: number | null
          type?: Database["public"]["Enums"]["TransactionType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Transaction_accountId_fkey"
            columns: ["accountId"]
            isOneToOne: false
            referencedRelation: "Account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Transaction_cardId_fkey"
            columns: ["cardId"]
            isOneToOne: false
            referencedRelation: "Card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Transaction_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Transaction_toAccountId_fkey"
            columns: ["toAccountId"]
            isOneToOne: false
            referencedRelation: "Account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Transaction_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      TransactionTag: {
        Row: {
          tagId: string
          transactionId: string
        }
        Insert: {
          tagId: string
          transactionId: string
        }
        Update: {
          tagId?: string
          transactionId?: string
        }
        Relationships: [
          {
            foreignKeyName: "TransactionTag_tagId_fkey"
            columns: ["tagId"]
            isOneToOne: false
            referencedRelation: "Tag"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TransactionTag_transactionId_fkey"
            columns: ["transactionId"]
            isOneToOne: false
            referencedRelation: "Transaction"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          defaultCurrency: string
          email: string
          id: string
          name: string
          passwordHash: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          defaultCurrency?: string
          email: string
          id?: string
          name: string
          passwordHash: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          defaultCurrency?: string
          email?: string
          id?: string
          name?: string
          passwordHash?: string
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_balance_deltas: {
        Args: { p_user_id: string }
        Returns: {
          accountId: string
          delta: number
        }[]
      }
      category_breakdown: {
        Args: {
          p_currency: string
          p_end: string
          p_start: string
          p_type: Database["public"]["Enums"]["TransactionType"]
          p_user_id: string
        }
        Returns: {
          color: string
          count: number
          icon: string
          id: string
          name: string
          total: number
        }[]
      }
      monthly_totals: {
        Args: {
          p_currency: string
          p_end: string
          p_start: string
          p_user_id: string
        }
        Returns: {
          expense: number
          income: number
          month: string
        }[]
      }
      save_transaction: {
        Args: {
          p_account_id: string
          p_amount: number
          p_category_id: string
          p_date: string
          p_id: string
          p_note: string
          p_tag_ids: string[]
          p_to_account_id: string
          p_to_amount: number
          p_type: Database["public"]["Enums"]["TransactionType"]
          p_user_id: string
        }
        Returns: string
      }
      totals_by_currency: {
        Args: { p_end: string; p_start: string; p_user_id: string }
        Returns: {
          currency: string
          expense: number
          income: number
        }[]
      }
    }
    Enums: {
      AccountType:
        | "CASH"
        | "BANK"
        | "SAVINGS"
        | "CREDIT_CARD"
        | "INVESTMENT"
        | "OTHER"
      CategoryType: "INCOME" | "EXPENSE"
      TransactionType: "INCOME" | "EXPENSE" | "TRANSFER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AccountType: [
        "CASH",
        "BANK",
        "SAVINGS",
        "CREDIT_CARD",
        "INVESTMENT",
        "OTHER",
      ],
      CategoryType: ["INCOME", "EXPENSE"],
      TransactionType: ["INCOME", "EXPENSE", "TRANSFER"],
    },
  },
} as const
