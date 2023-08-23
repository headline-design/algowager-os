import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

# --- State ---

# Global
GLOBAL_ADMIN: TealType.bytes = Bytes("admin") # admin address
GLOBAL_PAUSED: TealType.uint64 = Bytes("paused") # global pause state

# Local
LOCAL_LIMIT_DATE: TealType.uint64 = Bytes("limit_date") # time after which no wagers are accepted
LOCAL_END_DATE: TealType.uint64 = Bytes("end_date") # time after which the winner is decided

LOCAL_WAGER_STATE: TealType.bytes = Bytes("wager_state") # state of wager (pending/active)
LOCAL_WAGER_AMOUNT: TealType.uint64 = Bytes("wager_amount") # amount betted (in microALGO's)
LOCAL_WAGER_ASA_ID: TealType.uint64 = Bytes("wager_asa_id") # asset index for ASA which is betted against (eg. algo/usdc)
LOCAL_WAGER_BET_DIRECTION: TealType.bytes = Bytes("wager_bet_direction") # wager bet direction (UP/DOWN)
LOCAL_WAGER_AGAINST: TealType.bytes = Bytes("wager_against") # account address against which the wager is placed
LOCAL_ASA_PRICE_AT_WAGER_ACCPET: TealType.bytes = Bytes("asa_price_at_wager_accept") # the price of asa (eg. algo/usdc) "at the moment" at which the wager is accepted
LOCAL_WAGER_RESULT: TealType.bytes = Bytes("wager_result") # final result of bet (WON/LOST)


# --- Helper Functions ---
@Subroutine(TealType.uint64)
def basic_checks(tx_idx):
    """
    Txn common checks (rekey, close_rem_to, asset_close_to)
    """
    return And(
            Gtxn[tx_idx].rekey_to() == Global.zero_address(),
            Gtxn[tx_idx].close_remainder_to() == Global.zero_address(),
            Gtxn[tx_idx].asset_close_to() == Global.zero_address()
        )


@Subroutine(TealType.none)
def assert_sender_admin():
    """
    Asserts txn.sender is admin
    """
    return Assert(
        And(
            basic_checks(Int(0)),
            Txn.sender() == App.globalGet(GLOBAL_ADMIN)
        )
    )

def now(): return Global.latest_timestamp()


def approval_program(ARG_FEE_ADDRESS, ARG_ASA_ID, ARG_ORACLE_APP_ID):
    """
    Wager App contract

    Commands:
        pause_app                pause app (only by admin)
        unpause_app              unpause app (only by admin)
    """

    is_admin = Txn.sender() == App.globalGet(GLOBAL_ADMIN)

    # counters used in For loop below
    i = ScratchVar(TealType.uint64)

    # initialization
    on_initialize = Seq([
        App.globalPut(GLOBAL_ADMIN, Txn.sender()),
        Return(Int(1))
    ])

    # Pause all operations (callable only by admin)
    pause_app = Seq([
        assert_sender_admin(),
        App.globalPut(GLOBAL_PAUSED, Int(1)),
        Return(Int(1))
    ])

    # resume all operations (callable only by admin)
    unpause_app = Seq([
        assert_sender_admin(),
        App.globalPut(GLOBAL_PAUSED, Int(0)),
        Return(Int(1))
    ])


    scratchvar_limit_date = ScratchVar(TealType.uint64)
    scratchvar_end_date = ScratchVar(TealType.uint64)

    # Placing a new bet by a user against an ASA (eg. ALGO/USDC)
    # Expected args:
    # * app_args: [
    #       limit_date,
    #       end_date,
    #       wager_bet_direction
    #   ]
    # * foreignAssets: [ ASA_ID ]
    place_new_bet = Seq([
        # store limit_date & end_date in scratch
        Assert(Txn.application_args.length() == Int(4)),
        scratchvar_limit_date.store(Btoi(Txn.application_args[1])),
        scratchvar_end_date.store(Btoi(Txn.application_args[2])),

        Assert(
            And(
                Global.group_size() == Int(2),
                basic_checks(Int(0)),
                Gtxn[0].type_enum() == TxnType.ApplicationCall,

                basic_checks(Int(1)),
                Gtxn[1].type_enum() == TxnType.Payment,
                Gtxn[1].amount() >= Int(1 * 1000000), # bet should be "atleast" 1 ALGO
                Gtxn[1].receiver() == Global.current_application_address(),
                Gtxn[0].sender() == Gtxn[1].sender(),

                # verify the asa_id for which wager is placed is VALID & exists
                Txn.assets.length() == Int(1),
                Txn.assets[0] == Int(ARG_ASA_ID),

                Txn.application_args.length() == Int(4),
                # now () < limit_date < end_date
                now() < scratchvar_limit_date.load(),
                scratchvar_limit_date.load() < scratchvar_end_date.load(),
                Or(
                    Txn.application_args[3] == Bytes("UP"),
                    Txn.application_args[3] == Bytes("DOWN")
                )
            )
        ),

        # set local state variables
        App.localPut(Txn.sender(), LOCAL_LIMIT_DATE, scratchvar_limit_date.load()),
        App.localPut(Txn.sender(), LOCAL_END_DATE, scratchvar_end_date.load()),
        App.localPut(Txn.sender(), LOCAL_WAGER_STATE, Bytes("PENDING")),
        App.localPut(Txn.sender(), LOCAL_WAGER_BET_DIRECTION, Txn.application_args[3]),
        App.localPut(Txn.sender(), LOCAL_WAGER_AMOUNT, Gtxn[1].amount()),
        Return(Int(1))
    ])

    algo_usdc_price = App.globalGetEx(Int(ARG_ORACLE_APP_ID), Bytes("price"))

    # Assert a new bet for an ASA against a user
    # Expected args:
    # * foreign_accounts: [ better_acc_address ]
    # * foreign_apps: [ ALGO/USDC oracle_app_id ]
    accept_bet = Seq([
        algo_usdc_price,
        Assert(
            And(
                Global.group_size() == Int(2),
                basic_checks(Int(0)),
                Gtxn[0].type_enum() == TxnType.ApplicationCall,

                basic_checks(Int(1)),
                Gtxn[1].type_enum() == TxnType.Payment,
                Gtxn[1].receiver() == Global.current_application_address(),
                # amount must be equal to the bet userA put up for the bet
                Gtxn[1].amount() == App.localGet(Int(1), LOCAL_WAGER_AMOUNT),
                Gtxn[0].sender() == Gtxn[1].sender(),

                now() < App.localGet(Int(1), LOCAL_LIMIT_DATE),
                App.localGet(Int(1), LOCAL_WAGER_STATE) == Bytes("PENDING")
            )
        ),

        App.localPut(Txn.sender(), LOCAL_LIMIT_DATE, App.localGet(Int(1), LOCAL_LIMIT_DATE)),
        App.localPut(Txn.sender(), LOCAL_END_DATE, App.localGet(Int(1), LOCAL_END_DATE)),

        # set both local state to LIVE
        App.localPut(Txn.sender(), LOCAL_WAGER_STATE, Bytes("LIVE")),
        App.localPut(Int(1), LOCAL_WAGER_STATE, Bytes("LIVE")),

        # set the address against which the wager is placed (for both accounts)
        App.localPut(Txn.sender(), LOCAL_WAGER_AGAINST, Txn.accounts[1]),
        App.localPut(Int(1), LOCAL_WAGER_AGAINST, Txn.sender()),

        # set the price "at the moment" at which the wager is accepted
        # (this will be compared against at the end_time)
        App.localPut(Txn.sender(), LOCAL_ASA_PRICE_AT_WAGER_ACCPET, algo_usdc_price.value()),
        
        App.localPut(Txn.sender(), LOCAL_WAGER_AMOUNT, App.localGet(Int(1), LOCAL_WAGER_AMOUNT)),
        If(
            App.localGet(Int(1), LOCAL_WAGER_BET_DIRECTION) == Bytes("UP")
        )
        .Then(App.localPut(Txn.sender(), LOCAL_WAGER_BET_DIRECTION, Bytes("DOWN")))
        .Else(App.localPut(Txn.sender(), LOCAL_WAGER_BET_DIRECTION, Bytes("UP"))),
        Return(Int(1))
    ])


    # Decide the winner of a placed and accepted bet (only callable by admin)
    # Expected args:
    # * foreign_accounts: [ acc_1_address, acc_2_address ] (note: account2 must be the account who "accepted the wager")
    # * foreign_apps: [ ALGO/USDC oracle_app_id ]
    decide_winner = Seq([
        assert_sender_admin(),
        algo_usdc_price,
        Assert(
            And(
                Global.group_size() == Int(1),
                Gtxn[0].type_enum() == TxnType.ApplicationCall,

                # wager state should be live in both accounts
                Txn.accounts.length() == Int(2),
                App.localGet(Int(1), LOCAL_WAGER_STATE) == Bytes("LIVE"),
                App.localGet(Int(2), LOCAL_WAGER_STATE) == Bytes("LIVE"),

                # imp: account who "accepted" the wager must be 2nd in Txn.accounts[]
                # as that's the account we set the price of asa in (at the time which wager was accepted)
                App.localGet(Int(2), LOCAL_ASA_PRICE_AT_WAGER_ACCPET) != Int(0),

                # we must decide winner "at" or after end time
                now() >= App.localGet(Int(1), LOCAL_END_DATE),
            )
        ),

        If(
            And(
                # user2 won (betted for UP, and the price went UP)
                App.localGet(Int(2), LOCAL_WAGER_BET_DIRECTION) == Bytes("UP"),
                algo_usdc_price.value() > App.localGet(Int(2), LOCAL_ASA_PRICE_AT_WAGER_ACCPET)
            )
        )
        .Then(
            Seq([

                # pay the winner full amount
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.receiver: Txn.accounts[2],
                        TxnField.amount: Int(2) * App.localGet(Int(2), LOCAL_WAGER_AMOUNT),
                        TxnField.fee: Int(1000)
                    }
                ),
                InnerTxnBuilder.Submit(),

                App.localPut(Int(1), LOCAL_WAGER_RESULT, Bytes("LOST")),
                App.localPut(Int(2), LOCAL_WAGER_RESULT, Bytes("WON")),
            ])
        )
        # else user1 won
        .Else(
            Seq([
                # pay the winner full amount
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.receiver: Txn.accounts[1],
                        TxnField.amount: Int(2) * App.localGet(Int(2), LOCAL_WAGER_AMOUNT),
                        TxnField.fee: Int(1000)
                    }
                ),
                InnerTxnBuilder.Submit(),

                App.localPut(Int(1), LOCAL_WAGER_RESULT, Bytes("WON")),
                App.localPut(Int(2), LOCAL_WAGER_RESULT, Bytes("LOST")),
            ])
        ),

        # update state to ended
        App.localPut(Int(1), LOCAL_WAGER_STATE, Bytes("ENDED")),
        App.localPut(Int(2), LOCAL_WAGER_STATE, Bytes("ENDED")),

        # remove other local state variables
        App.localDel(Int(1), LOCAL_LIMIT_DATE),
        App.localDel(Int(1), LOCAL_END_DATE),
        App.localDel(Int(1), LOCAL_WAGER_AMOUNT),
        App.localDel(Int(1), LOCAL_WAGER_BET_DIRECTION),
        App.localDel(Int(1), LOCAL_WAGER_AGAINST),


        App.localDel(Int(2), LOCAL_LIMIT_DATE),
        App.localDel(Int(2), LOCAL_END_DATE),
        App.localDel(Int(2), LOCAL_WAGER_AMOUNT),
        App.localDel(Int(2), LOCAL_WAGER_BET_DIRECTION),
        App.localDel(Int(2), LOCAL_WAGER_AGAINST),
        App.localDel(Int(2), LOCAL_ASA_PRICE_AT_WAGER_ACCPET),
        Return(Int(1))
    ])


    program = Cond(
        # Verfies that the application_id is 0, jumps to on_initialize.
        [Txn.application_id() == Int(0), on_initialize],
        # Verifies Update transaction, accepts only if sender is admin.
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_admin)],
        # Verifies Update or delete transaction, rejects it.
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        # Verifies closeout or OptIn transaction, approves it.
        [
            Or(
                Txn.on_completion() == OnComplete.CloseOut,
                Txn.on_completion() == OnComplete.OptIn
            ),
            Return(Int(1))
        ],
        # if app is paused, and sender is not admin, do not proceed.
        # So if pause has been triggerred, normal operations can resume only
        # after admin unpauses the app (by calling "unpause_app" branch)
        [
            And(
                App.globalGet(GLOBAL_PAUSED) == Int(1),
                Txn.sender() != App.globalGet(GLOBAL_ADMIN),
            ),
            Err()
        ],
        [Txn.application_args[0] == Bytes("pause_app"), pause_app],
        [Txn.application_args[0] == Bytes("unpause_app"), unpause_app],
        [Txn.application_args[0] == Bytes("place_new_bet"), place_new_bet],
        [Txn.application_args[0] == Bytes("accept_bet"), accept_bet],
        [Txn.application_args[0] == Bytes("decide_winner"), decide_winner],
    )

    return program

if __name__ == "__main__":
    params = {
        # fee wallet address
        "ARG_FEE_ADDRESS": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
        # asset index for this app (eg. algo/usdt asaID)
        "ARG_ASA_ID": 0,
        # oracle app index tracking this ASA's price (i.e algo/usdt price oracle)
        "ARG_ORACLE_APP_ID": 0,
    }

    # Overwrite params if sys.argv[1] is passed
    if(len(sys.argv) > 1):
        params = parse_params(sys.argv[1], params)

    print(compileTeal(
            approval_program(
                params["ARG_FEE_ADDRESS"],
                params["ARG_ASA_ID"],
                params["ARG_ORACLE_APP_ID"],
            ),
            Mode.Application,
            version = 6
        )
    )