/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/fiador.json`.
 */
export type Fiador = {
  "address": "AxA7odS9fftDNCmx8QaqYiiU79mNEemTcper2VWswjp4",
  "metadata": {
    "name": "fiador",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Fiador.sol — garantia locatícia on-chain"
  },
  "instructions": [
    {
      "name": "acceptLease",
      "docs": [
        "Inquilino aceita e deposita a caução."
      ],
      "discriminator": [
        73,
        241,
        95,
        119,
        218,
        242,
        102,
        155
      ],
      "accounts": [
        {
          "name": "tenant",
          "writable": true,
          "signer": true,
          "relations": [
            "lease",
            "profile"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "agency",
          "writable": true
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "tenant"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tenant"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "vault",
          "docs": [
            "Cofre da caução: só o PDA do contrato movimenta."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lease"
              }
            ]
          }
        },
        {
          "name": "tenantToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "cancelPoolPayment",
      "docs": [
        "Admin cancela um pagamento do fundo em quarentena (golpe confirmado)."
      ],
      "discriminator": [
        100,
        81,
        108,
        96,
        216,
        164,
        41,
        243
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "claimDefault",
      "docs": [
        "Qualquer um cobra um mês vencido além da carência: caução e pool pagam o proprietário."
      ],
      "discriminator": [
        12,
        132,
        209,
        37,
        163,
        22,
        128,
        241
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Quem aciona só paga a taxa da transação."
          ],
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "agency",
          "writable": true
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lease"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "landlordToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "closeLease",
      "docs": [
        "Acerto final: repõe o pool, devolve caução + rendimento, atualiza reputação."
      ],
      "discriminator": [
        255,
        18,
        132,
        70,
        221,
        92,
        32,
        155
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "yieldReserve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  114,
                  101,
                  115,
                  101,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "agency",
          "writable": true
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lease"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "tenantToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "createLease",
      "docs": [
        "Imobiliária + proprietário registram um contrato."
      ],
      "discriminator": [
        158,
        42,
        229,
        17,
        202,
        87,
        68,
        148
      ],
      "accounts": [
        {
          "name": "agencyAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "landlord",
          "signer": true
        },
        {
          "name": "tenant"
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "agency",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "agencyAuthority"
              }
            ]
          }
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "landlord"
              },
              {
                "kind": "account",
                "path": "tenant"
              },
              {
                "kind": "arg",
                "path": "leaseId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "leaseId",
          "type": "u64"
        },
        {
          "name": "terms",
          "type": {
            "defined": {
              "name": "leaseTerms"
            }
          }
        }
      ]
    },
    {
      "name": "endLease",
      "docs": [
        "Fim do prazo: abre a janela de contestação."
      ],
      "discriminator": [
        103,
        185,
        73,
        192,
        161,
        29,
        161,
        186
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "freezePoolPayment",
      "docs": [
        "Admin congela ou descongela um pagamento do fundo em quarentena."
      ],
      "discriminator": [
        8,
        172,
        222,
        217,
        217,
        55,
        151,
        255
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "frozen",
          "type": "bool"
        }
      ]
    },
    {
      "name": "initProfile",
      "docs": [
        "Inquilino cria seu perfil de reputação."
      ],
      "discriminator": [
        210,
        162,
        212,
        95,
        95,
        186,
        89,
        119
      ],
      "accounts": [
        {
          "name": "tenant",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tenant"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "docs": [
        "Cria as regras globais, o pool (com depósito inicial permanente) e a reserva de rendimento."
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "poolVault",
          "docs": [
            "Cofre do pool: só o PDA `pool` movimenta."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "yieldReserve",
          "docs": [
            "Reserva que paga o rendimento simulado da caução: só o PDA `config` movimenta."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100,
                  95,
                  114,
                  101,
                  115,
                  101,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "adminToken",
          "docs": [
            "Conta do admin de onde sai o depósito inicial permanente do pool."
          ],
          "writable": true
        },
        {
          "name": "programData",
          "docs": [
            "Dados do programa publicado: só quem publicou (a autoridade de atualização)",
            "pode inicializar. Sem isso, qualquer carteira que chamasse primeiro na devnet",
            "viraria admin para sempre e escolheria o mint (B-A21)."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  147,
                  218,
                  111,
                  145,
                  73,
                  243,
                  192,
                  173,
                  110,
                  68,
                  193,
                  219,
                  109,
                  37,
                  166,
                  206,
                  6,
                  96,
                  92,
                  105,
                  105,
                  55,
                  45,
                  230,
                  174,
                  232,
                  237,
                  185,
                  2,
                  210,
                  151,
                  193
                ]
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                2,
                168,
                246,
                145,
                78,
                136,
                161,
                176,
                226,
                16,
                21,
                62,
                247,
                99,
                174,
                43,
                0,
                194,
                185,
                61,
                22,
                193,
                36,
                210,
                192,
                83,
                122,
                16,
                4,
                128,
                0,
                0
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "configParams"
            }
          }
        },
        {
          "name": "initialPoolDeposit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "openDispute",
      "docs": [
        "Proprietário contesta danos dentro da janela."
      ],
      "discriminator": [
        137,
        25,
        99,
        119,
        23,
        223,
        161,
        42
      ],
      "accounts": [
        {
          "name": "landlord",
          "signer": true,
          "relations": [
            "lease"
          ]
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "landlord"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "openPosition",
      "docs": [
        "Investidor abre sua posição no pool."
      ],
      "discriminator": [
        135,
        128,
        47,
        77,
        15,
        152,
        240,
        49
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "payRent",
      "docs": [
        "Inquilino paga o próximo mês (ou quita um mês já coberto)."
      ],
      "discriminator": [
        69,
        155,
        112,
        183,
        178,
        234,
        94,
        100
      ],
      "accounts": [
        {
          "name": "tenant",
          "writable": true,
          "signer": true,
          "relations": [
            "lease",
            "profile"
          ]
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "tenant"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lease"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tenant"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "tenantToken",
          "writable": true
        },
        {
          "name": "landlordToken",
          "docs": [
            "Conta de tBRL do proprietário que recebe o aluguel."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "badgeMint",
          "writable": true,
          "optional": true
        },
        {
          "name": "tenantBadge",
          "writable": true,
          "optional": true
        },
        {
          "name": "badgeTokenProgram",
          "optional": true,
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "poolDeposit",
      "docs": [
        "Investidor deposita tBRL no pool e recebe cotas."
      ],
      "discriminator": [
        26,
        109,
        164,
        79,
        207,
        145,
        204,
        217
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "ownerToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "poolWithdraw",
      "docs": [
        "Investidor saca depois do aviso prévio."
      ],
      "discriminator": [
        50,
        1,
        23,
        25,
        135,
        221,
        159,
        182
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "ownerToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "registerAgency",
      "docs": [
        "Admin credencia uma imobiliária."
      ],
      "discriminator": [
        102,
        193,
        24,
        185,
        91,
        84,
        85,
        245
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "agency",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  99,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "authority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "releasePoolPayment",
      "docs": [
        "Qualquer um libera ao proprietário o pagamento do fundo depois da quarentena."
      ],
      "discriminator": [
        165,
        201,
        91,
        39,
        206,
        130,
        186,
        153
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Qualquer carteira (o keeper) libera depois do prazo; só paga a taxa."
          ],
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "landlordToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "requestWithdraw",
      "docs": [
        "Investidor pede saque (aviso prévio)."
      ],
      "discriminator": [
        137,
        95,
        187,
        96,
        250,
        138,
        31,
        182
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "shares",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveDispute",
      "docs": [
        "Imobiliária decide quanto da caução vai ao proprietário."
      ],
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "agencyAuthority",
          "signer": true
        },
        {
          "name": "agency",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "agencyAuthority"
              }
            ]
          }
        },
        {
          "name": "lease",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "lease.landlord",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.tenant",
                "account": "lease"
              },
              {
                "kind": "account",
                "path": "lease.leaseId",
                "account": "lease"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "lease"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "landlordToken",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "award",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setAgencyActive",
      "docs": [
        "Admin suspende ou reativa uma imobiliária."
      ],
      "discriminator": [
        134,
        79,
        209,
        241,
        194,
        127,
        64,
        14
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "agency",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "agency.authority",
                "account": "agency"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    },
    {
      "name": "setBadgeMint",
      "docs": [
        "Admin define o mint do selo \"Bom Pagador\" (Token-2022 intransferível)."
      ],
      "discriminator": [
        6,
        253,
        114,
        46,
        45,
        96,
        138,
        225
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "badgeMint"
        },
        {
          "name": "badgeTokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "setPaused",
      "docs": [
        "Admin pausa ou retoma o protocolo (resposta a incidente)."
      ],
      "discriminator": [
        91,
        60,
        125,
        192,
        176,
        225,
        166,
        218
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agency",
      "discriminator": [
        190,
        253,
        179,
        184,
        231,
        128,
        71,
        112
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "lease",
      "discriminator": [
        14,
        103,
        218,
        61,
        248,
        234,
        105,
        84
      ]
    },
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    },
    {
      "name": "tenantProfile",
      "discriminator": [
        148,
        155,
        86,
        68,
        85,
        93,
        148,
        94
      ]
    }
  ],
  "events": [
    {
      "name": "aluguelPago",
      "discriminator": [
        19,
        86,
        83,
        187,
        131,
        230,
        23,
        127
      ]
    },
    {
      "name": "atrasoCobrado",
      "discriminator": [
        144,
        183,
        0,
        250,
        16,
        17,
        178,
        207
      ]
    },
    {
      "name": "contratoEncerrado",
      "discriminator": [
        114,
        85,
        136,
        144,
        102,
        210,
        233,
        132
      ]
    },
    {
      "name": "imobiliariaAtualizada",
      "discriminator": [
        60,
        201,
        113,
        252,
        111,
        23,
        205,
        63
      ]
    },
    {
      "name": "pagamentoDoFundoCancelado",
      "discriminator": [
        183,
        193,
        122,
        82,
        136,
        98,
        159,
        59
      ]
    },
    {
      "name": "pagamentoDoFundoCongelado",
      "discriminator": [
        141,
        199,
        201,
        216,
        90,
        212,
        221,
        206
      ]
    },
    {
      "name": "pagamentoDoFundoLiberado",
      "discriminator": [
        29,
        57,
        115,
        188,
        81,
        15,
        142,
        140
      ]
    },
    {
      "name": "protocoloPausado",
      "discriminator": [
        235,
        0,
        34,
        10,
        79,
        89,
        51,
        71
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidConfig",
      "msg": "Parâmetro de configuração inválido"
    },
    {
      "code": 6001,
      "name": "periodTooShort",
      "msg": "Período menor que o mínimo permitido"
    },
    {
      "code": 6002,
      "name": "invalidPeriods",
      "msg": "Número de períodos inválido"
    },
    {
      "code": 6003,
      "name": "invalidRent",
      "msg": "Valor do aluguel inválido"
    },
    {
      "code": 6004,
      "name": "sameParty",
      "msg": "Proprietário e inquilino precisam ser pessoas diferentes"
    },
    {
      "code": 6005,
      "name": "agencyInactive",
      "msg": "Imobiliária não credenciada ou inativa"
    },
    {
      "code": 6006,
      "name": "invalidStatus",
      "msg": "Contrato não está no estado esperado"
    },
    {
      "code": 6007,
      "name": "insufficientPoolCoverage",
      "msg": "Pool sem cobertura livre suficiente"
    },
    {
      "code": 6008,
      "name": "agencyCoverageLimit",
      "msg": "Imobiliária atingiu o limite de cobertura do pool"
    },
    {
      "code": 6009,
      "name": "invalidTokenAccount",
      "msg": "Conta de token com mint ou dono errado"
    },
    {
      "code": 6010,
      "name": "mathOverflow",
      "msg": "Estouro aritmético"
    },
    {
      "code": 6011,
      "name": "noPeriodDue",
      "msg": "Todos os períodos já foram pagos"
    },
    {
      "code": 6012,
      "name": "nothingToClaim",
      "msg": "Nenhum período vencido além da carência"
    },
    {
      "code": 6013,
      "name": "leaseNotOver",
      "msg": "O contrato ainda não chegou ao fim"
    },
    {
      "code": 6014,
      "name": "pendingPeriods",
      "msg": "Ainda há períodos vencidos sem pagamento nem cobrança"
    },
    {
      "code": 6015,
      "name": "disputeWindowClosed",
      "msg": "Fora da janela de contestação"
    },
    {
      "code": 6016,
      "name": "disputeWindowOpen",
      "msg": "A janela de contestação ainda está aberta"
    },
    {
      "code": 6017,
      "name": "invalidAmount",
      "msg": "Valor inválido"
    },
    {
      "code": 6018,
      "name": "cooldownActive",
      "msg": "Aviso prévio de saque ainda não terminou"
    },
    {
      "code": 6019,
      "name": "noPendingWithdraw",
      "msg": "Não há pedido de saque"
    },
    {
      "code": 6020,
      "name": "withdrawExceedsFree",
      "msg": "Saque maior que o valor livre do pool"
    },
    {
      "code": 6021,
      "name": "invalidBadgeMint",
      "msg": "Mint do selo inválido: precisa ser Token-2022, intransferível, 0 casas e autoridade = config"
    },
    {
      "code": 6022,
      "name": "invalidBadgeAccounts",
      "msg": "Contas do selo ausentes ou erradas"
    },
    {
      "code": 6023,
      "name": "agencyIsLandlord",
      "msg": "A imobiliária não pode ser a proprietária do imóvel"
    },
    {
      "code": 6024,
      "name": "periodTooLong",
      "msg": "Período maior que o máximo permitido"
    },
    {
      "code": 6025,
      "name": "periodNotStarted",
      "msg": "Esse mês ainda não começou: não dá para pagar adiantado"
    },
    {
      "code": 6026,
      "name": "disputeAlreadyResolved",
      "msg": "A disputa de danos já foi decidida"
    },
    {
      "code": 6027,
      "name": "protocolPaused",
      "msg": "O protocolo está pausado para investigação"
    },
    {
      "code": 6028,
      "name": "poolPaymentPending",
      "msg": "Há um pagamento do fundo em quarentena neste contrato"
    },
    {
      "code": 6029,
      "name": "poolPaymentFrozen",
      "msg": "O pagamento do fundo está congelado para investigação"
    },
    {
      "code": 6030,
      "name": "quarantineActive",
      "msg": "A quarentena do pagamento do fundo ainda não terminou"
    },
    {
      "code": 6031,
      "name": "nothingPending",
      "msg": "Não há pagamento do fundo em quarentena"
    },
    {
      "code": 6032,
      "name": "notUpgradeAuthority",
      "msg": "Só quem publicou o programa pode inicializá-lo"
    }
  ],
  "types": [
    {
      "name": "agency",
      "docs": [
        "Imobiliária credenciada pelo admin. Só ela cria contratos, o que barra",
        "o conluio proprietário+inquilino para drenar o pool (SEGURANCA.md, item 1)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "coverageInUse",
            "docs": [
              "Soma da cobertura do pool travada pelos contratos ativos desta imobiliária."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "aluguelPago",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lease",
            "type": "pubkey"
          },
          {
            "name": "periodo",
            "type": "u8"
          },
          {
            "name": "emDia",
            "type": "bool"
          },
          {
            "name": "aoProprietario",
            "type": "u64"
          },
          {
            "name": "aoFundo",
            "type": "u64"
          },
          {
            "name": "aCaucao",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "atrasoCobrado",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lease",
            "type": "pubkey"
          },
          {
            "name": "periodo",
            "type": "u8"
          },
          {
            "name": "daCaucao",
            "type": "u64"
          },
          {
            "name": "doFundo",
            "type": "u64"
          },
          {
            "name": "emQuarentena",
            "type": "bool"
          },
          {
            "name": "faltaAoProprietario",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "config",
      "docs": [
        "Regras globais do protocolo. Criada uma única vez no `initialize`.",
        "Contratos copiam os termos daqui na criação, então mudanças futuras",
        "nunca alteram um contrato já assinado (SEGURANCA.md, item 8)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "Stablecoin de real usada em tudo (tBRL na devnet)."
            ],
            "type": "pubkey"
          },
          {
            "name": "demoMode",
            "docs": [
              "Deploy de demonstração: permite \"meses\" de segundos. Fixado no initialize."
            ],
            "type": "bool"
          },
          {
            "name": "minPeriodSecs",
            "docs": [
              "Duração mínima de um período (28 dias em produção)."
            ],
            "type": "i64"
          },
          {
            "name": "maxPeriodSecs",
            "docs": [
              "Duração máxima de um período. Impede \"meses\" de 100 anos que travam o fundo (B-A26)."
            ],
            "type": "i64"
          },
          {
            "name": "minRentAmount",
            "docs": [
              "Aluguel mínimo. Impede reputação fabricada com aluguel de centavos (B-A23)."
            ],
            "type": "u64"
          },
          {
            "name": "graceSecs",
            "docs": [
              "Carência depois do vencimento antes de poder cobrar o atraso."
            ],
            "type": "i64"
          },
          {
            "name": "premiumBps",
            "docs": [
              "Prêmio pago ao pool em cada aluguel, em pontos-base (800 = 8%)."
            ],
            "type": "u16"
          },
          {
            "name": "apyBps",
            "docs": [
              "Rendimento anual simulado da caução, em pontos-base (1000 = 10%)."
            ],
            "type": "u16"
          },
          {
            "name": "coverageMonths",
            "docs": [
              "Quantos aluguéis o pool cobre além da caução."
            ],
            "type": "u8"
          },
          {
            "name": "maxCoverageAmount",
            "docs": [
              "Teto absoluto de cobertura por contrato."
            ],
            "type": "u64"
          },
          {
            "name": "coverageWaitingPeriods",
            "docs": [
              "Aluguéis pagos em dia exigidos antes de o pool passar a cobrir."
            ],
            "type": "u8"
          },
          {
            "name": "coverageGrowthBps",
            "docs": [
              "Quanto a cobertura do fundo cresce a cada aluguel pago, em pontos-base de",
              "um aluguel (2500 = ¼ de aluguel por mês; cobertura cheia de 3 aluguéis em 12 meses).",
              "Tira o lucro do golpe de pagar pouco e dar calote logo (antifraude, camada 1)."
            ],
            "type": "u16"
          },
          {
            "name": "landlordDeductibleBps",
            "docs": [
              "Franquia do proprietário: parte do que falta que o fundo NÃO paga (2000 = 20%).",
              "Continua sendo dívida da inquilina com o proprietário (`landlord_debt`)."
            ],
            "type": "u16"
          },
          {
            "name": "agencyMaxPoolBps",
            "docs": [
              "Fatia máxima do pool que uma única imobiliária pode travar."
            ],
            "type": "u16"
          },
          {
            "name": "withdrawCooldownSecs",
            "docs": [
              "Aviso prévio para sacar do pool."
            ],
            "type": "i64"
          },
          {
            "name": "disputeWindowSecs",
            "docs": [
              "Janela para o proprietário contestar danos no fim do contrato."
            ],
            "type": "i64"
          },
          {
            "name": "badgeMint",
            "docs": [
              "Mint do selo \"Bom Pagador\" (Token-2022, intransferível). `default` = ainda não definido."
            ],
            "type": "pubkey"
          },
          {
            "name": "paused",
            "docs": [
              "Pausa de emergência: bloqueia a entrada e a saída de dinheiro do fundo e",
              "novos contratos. O pagamento de aluguel continua (08-RESPOSTA-A-GOLPE, passo 1)."
            ],
            "type": "bool"
          },
          {
            "name": "poolQuarantineSecs",
            "docs": [
              "Quarentena do pagamento do fundo: o valor fica retido esse tempo antes de",
              "ir ao proprietário, e o admin pode congelar ou cancelar (antifraude, camada 2)."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "configParams",
      "docs": [
        "Parâmetros do `initialize`. Validados em `validate`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "demoMode",
            "type": "bool"
          },
          {
            "name": "minPeriodSecs",
            "type": "i64"
          },
          {
            "name": "maxPeriodSecs",
            "type": "i64"
          },
          {
            "name": "minRentAmount",
            "type": "u64"
          },
          {
            "name": "graceSecs",
            "type": "i64"
          },
          {
            "name": "premiumBps",
            "type": "u16"
          },
          {
            "name": "apyBps",
            "type": "u16"
          },
          {
            "name": "coverageMonths",
            "type": "u8"
          },
          {
            "name": "maxCoverageAmount",
            "type": "u64"
          },
          {
            "name": "coverageWaitingPeriods",
            "type": "u8"
          },
          {
            "name": "coverageGrowthBps",
            "type": "u16"
          },
          {
            "name": "landlordDeductibleBps",
            "type": "u16"
          },
          {
            "name": "agencyMaxPoolBps",
            "type": "u16"
          },
          {
            "name": "withdrawCooldownSecs",
            "type": "i64"
          },
          {
            "name": "disputeWindowSecs",
            "type": "i64"
          },
          {
            "name": "poolQuarantineSecs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "contratoEncerrado",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lease",
            "type": "pubkey"
          },
          {
            "name": "devolvidoAInquilina",
            "type": "u64"
          },
          {
            "name": "rendimento",
            "type": "u64"
          },
          {
            "name": "rendimentoDevido",
            "docs": [
              "Rendimento devido pela conta. Se for maior que o pago, a reserva acabou (B-A20)."
            ],
            "type": "u64"
          },
          {
            "name": "calote",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "imobiliariaAtualizada",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agency",
            "type": "pubkey"
          },
          {
            "name": "ativa",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "lease",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agency",
            "type": "pubkey"
          },
          {
            "name": "landlord",
            "type": "pubkey"
          },
          {
            "name": "tenant",
            "type": "pubkey"
          },
          {
            "name": "leaseId",
            "type": "u64"
          },
          {
            "name": "contractHash",
            "docs": [
              "SHA-256 do PDF do contrato. Nenhum dado pessoal on-chain (LGPD)."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "rentAmount",
            "type": "u64"
          },
          {
            "name": "periodSecs",
            "type": "i64"
          },
          {
            "name": "totalPeriods",
            "type": "u8"
          },
          {
            "name": "graceSecs",
            "type": "i64"
          },
          {
            "name": "premiumBps",
            "type": "u16"
          },
          {
            "name": "apyBps",
            "type": "u16"
          },
          {
            "name": "coverageCap",
            "docs": [
              "Quanto o pool cobre além da caução (já limitado pelo teto)."
            ],
            "type": "u64"
          },
          {
            "name": "coverageWaitingPeriods",
            "type": "u8"
          },
          {
            "name": "coverageGrowthBps",
            "type": "u16"
          },
          {
            "name": "landlordDeductibleBps",
            "type": "u16"
          },
          {
            "name": "disputeWindowSecs",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "leaseStatus"
              }
            }
          },
          {
            "name": "startTs",
            "type": "i64"
          },
          {
            "name": "depositRequired",
            "docs": [
              "Caução exigida no aceite (depende do tier do inquilino)."
            ],
            "type": "u64"
          },
          {
            "name": "depositBalance",
            "docs": [
              "Caução que está de fato no cofre agora."
            ],
            "type": "u64"
          },
          {
            "name": "depositDebt",
            "docs": [
              "Quanto o inquilino deve repor na caução."
            ],
            "type": "u64"
          },
          {
            "name": "poolDebt",
            "docs": [
              "Quanto o inquilino deve ao pool."
            ],
            "type": "u64"
          },
          {
            "name": "landlordDebt",
            "docs": [
              "Quanto o proprietário deixou de receber em meses cobrados sem dinheiro",
              "suficiente (caução e cobertura esgotadas). É pago primeiro na quitação (B-A10)."
            ],
            "type": "u64"
          },
          {
            "name": "poolPending",
            "docs": [
              "Pagamento do fundo ao proprietário retido em quarentena (ainda no cofre do fundo)."
            ],
            "type": "u64"
          },
          {
            "name": "poolReleaseTs",
            "docs": [
              "A partir de quando o pagamento em quarentena pode ser liberado."
            ],
            "type": "i64"
          },
          {
            "name": "poolFrozen",
            "docs": [
              "Congelado pelo admin enquanto investiga suspeita de golpe."
            ],
            "type": "bool"
          },
          {
            "name": "poolCoveredTotal",
            "docs": [
              "Total já pago pelo pool a este contrato (limitado a `coverage_cap`)."
            ],
            "type": "u64"
          },
          {
            "name": "periods",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "periodState"
                  }
                },
                36
              ]
            }
          },
          {
            "name": "paidOnTime",
            "type": "u8"
          },
          {
            "name": "paidLate",
            "type": "u8"
          },
          {
            "name": "defaults",
            "type": "u8"
          },
          {
            "name": "endTs",
            "type": "i64"
          },
          {
            "name": "disputeAmount",
            "type": "u64"
          },
          {
            "name": "disputeResolved",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "leaseStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "defaulted"
          },
          {
            "name": "ending"
          },
          {
            "name": "disputed"
          },
          {
            "name": "closed"
          }
        ]
      }
    },
    {
      "name": "leaseTerms",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rentAmount",
            "type": "u64"
          },
          {
            "name": "periodSecs",
            "type": "i64"
          },
          {
            "name": "totalPeriods",
            "type": "u8"
          },
          {
            "name": "contractHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "pagamentoDoFundoCancelado",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lease",
            "type": "pubkey"
          },
          {
            "name": "valor",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pagamentoDoFundoCongelado",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lease",
            "type": "pubkey"
          },
          {
            "name": "congelado",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "pagamentoDoFundoLiberado",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lease",
            "type": "pubkey"
          },
          {
            "name": "valor",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "periodState",
      "docs": [
        "Estado de cada período. Impede cobrar o mesmo mês duas vezes e impede",
        "que o proprietário receba em dobro (SEGURANCA.md, item 3)."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "paid"
          },
          {
            "name": "covered"
          },
          {
            "name": "settled"
          }
        ]
      }
    },
    {
      "name": "pool",
      "docs": [
        "Pool coletivo de garantia (\"fiador coletivo\").",
        "`total_assets` é contábil — nunca lido do saldo do cofre — para impedir",
        "o ataque da primeira cota (SEGURANCA.md, item 6)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalShares",
            "type": "u64"
          },
          {
            "name": "totalAssets",
            "type": "u64"
          },
          {
            "name": "lockedCoverage",
            "docs": [
              "Cobertura prometida a contratos ativos; não pode ser sacada."
            ],
            "type": "u64"
          },
          {
            "name": "premiumsEarned",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "position",
      "docs": [
        "Cotas de um investidor no pool de garantia."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "shares",
            "type": "u64"
          },
          {
            "name": "pendingShares",
            "docs": [
              "Cotas com saque pedido (continuam absorvendo perdas até o saque)."
            ],
            "type": "u64"
          },
          {
            "name": "requestTs",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "protocoloPausado",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pausado",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "tenantProfile",
      "docs": [
        "Histórico de bom pagador. Só o programa escreve aqui, e a conta não é",
        "transferível: a reputação é do inquilino."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tenant",
            "type": "pubkey"
          },
          {
            "name": "onTime",
            "type": "u32"
          },
          {
            "name": "late",
            "type": "u32"
          },
          {
            "name": "defaults",
            "type": "u32"
          },
          {
            "name": "leasesStarted",
            "docs": [
              "Contratos iniciados (aceitos) por este inquilino."
            ],
            "type": "u32"
          },
          {
            "name": "leasesCompleted",
            "type": "u32"
          },
          {
            "name": "lastOnTimeTs",
            "docs": [
              "Hora do último pagamento em dia que contou para a reputação. No máximo",
              "um por janela de `min_period_secs`, somando todos os contratos (B-A09/B-A23)."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
