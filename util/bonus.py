import math


def rank_factor(rank, num_players):
    """ Returns a weight/factor used in calculating bonus points.

        Gives the first player to answer “full” points (factor 1).
        From there the factor decreases following the function x^e
        and cuts off at the half point of the answer list with a
        factor of ~0.25 (0.5^e).
    """

    # player rank mappd to range [1, 0]
    zero_based_rank = rank - 1
    rank_one_to_zero = (num_players - zero_based_rank) / num_players

    # set everything below 0.5 to 0
    rank_one_to_half = rank_one_to_zero if rank_one_to_zero > 0.5 else 0

    # square for diminishing returns
    rank_factor = rank_one_to_half ** math.e

    return rank_factor


def bonus_points(score_rank_tuples, num_players):
    """
    """

    num_cols = len(score_rank_tuples)
    full_round_score = len(score_rank_tuples) * 10
    factor_sum = 0

    for score, rank in score_rank_tuples:
        # get player rank factor
        rank_fac = rank_factor(rank, num_players)

        # calculate score factor
        # - 20 -> 1
        # - 10 -> 1
        # -  5 -> 0.125
        score_fac = (min(score, 10) / 10) ** 3

        # add to sum
        factor_sum += rank_fac * score_fac

    bonus_fac = (factor_sum / num_cols) ** 2

    return full_round_score * bonus_fac


def demo_rank_factor():
    # for players in range(2, 11):
    #     print(f'Players: {players}')
    #     for rank in range(1, players + 1):
    #         print(f'{rank} -> {rank_factor(rank, players)}')
    #     print()
    #     print()
    #     print()
    # for full_point_rows in range(0, 9):
    #     for rank in range(1, 4):
    #         score_rank_tups = (
    #             [(10, rank)] * full_point_rows +
    #             [(0, rank)] * (8 - full_point_rows)
    #         )
    #         print(score_rank_tups)
    #         bp = bonus_points(score_rank_tups, 4)
    #         print(f'{full_point_rows} -> {bp}')
    pass


if __name__ == '__main__':
    demo_rank_factor()
