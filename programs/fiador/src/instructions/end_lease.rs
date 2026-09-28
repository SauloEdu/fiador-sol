use anchor_lang::prelude::*;

use crate::errors::FiadorError;
use crate::state::*;

/// Encerra o prazo do contrato e abre a janela de contestação.
/// Qualquer carteira pode chamar depois do último vencimento.
#[derive(Accounts)]
pub struct EndLease<'info> {
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"lease", lease.landlord.as_ref(), lease.tenant.as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
    )]
    pub lease: Account<'info, Lease>,
}

pub fn handle_end_lease(ctx: Context<EndLease>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let lease = &mut ctx.accounts.lease;
    require!(
        matches!(lease.status, LeaseStatus::Active | LeaseStatus::Defaulted),
        FiadorError::InvalidStatus
    );
    let last = lease.total_periods as usize - 1;
    require!(now >= lease.due_ts(last), FiadorError::LeaseNotOver);
    // Todo mês precisa estar pago ou cobrado antes do acerto final.
    require!(!lease.has_open(), FiadorError::PendingPeriods);

    lease.status = LeaseStatus::Ending;
    lease.end_ts = now;
    Ok(())
}
