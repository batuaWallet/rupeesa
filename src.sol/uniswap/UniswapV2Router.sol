// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "../interfaces/IERC20.sol";
import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/IWETH.sol";
import "../lib/SafeMath.sol";
import "../lib/TransferHelper.sol";
import "../lib/UniswapV2Library.sol";

contract uniswapv2router is iuniswapv2router {
    using safemath for uint;

    address public immutable factory;
    address public immutable weth;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, "uniswapv2router: expired");
        _;
    }

    constructor(address _factory, address _weth) {
        factory = _factory;
        weth = _weth;
    }

    receive() external payable {
        assert(msg.sender == weth); // only accept eth via fallback from the weth contract
    }

    // **** add liquidity ****
    function _addliquidity(
        address tokena,
        address tokenb,
        uint amountadesired,
        uint amountbdesired,
        uint amountamin,
        uint amountbmin
    ) internal virtual returns (uint amounta, uint amountb) {
        // create the pair if it doesn"t exist yet
        if (iuniswapv2factory(factory).getpair(tokena, tokenb) == address(0)) {
            iuniswapv2factory(factory).createpair(tokena, tokenb);
        }
        (uint reservea, uint reserveb) = uniswapv2library.getreserves(factory, tokena, tokenb);
        if (reservea == 0 && reserveb == 0) {
            (amounta, amountb) = (amountadesired, amountbdesired);
        } else {
            uint amountboptimal = uniswapv2library.quote(amountadesired, reservea, reserveb);
            if (amountboptimal <= amountbdesired) {
                require(amountboptimal >= amountbmin, "uniswapv2router: insufficient_b_amount");
                (amounta, amountb) = (amountadesired, amountboptimal);
            } else {
                uint amountaoptimal = uniswapv2library.quote(amountbdesired, reserveb, reservea);
                assert(amountaoptimal <= amountadesired);
                require(amountaoptimal >= amountamin, "uniswapv2router: insufficient_a_amount");
                (amounta, amountb) = (amountaoptimal, amountbdesired);
            }
        }
    }
    function addliquidity(
        address tokena,
        address tokenb,
        uint amountadesired,
        uint amountbdesired,
        uint amountamin,
        uint amountbmin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amounta, uint amountb, uint liquidity) {
        (amounta, amountb) = _addliquidity(tokena, tokenb, amountadesired, amountbdesired, amountamin, amountbmin);
        address pair = uniswapv2library.pairfor(factory, tokena, tokenb);
        transferhelper.safetransferfrom(tokena, msg.sender, pair, amounta);
        transferhelper.safetransferfrom(tokenb, msg.sender, pair, amountb);
        liquidity = iuniswapv2pair(pair).mint(to);
    }
    function addliquidityeth(
        address token,
        uint amounttokendesired,
        uint amounttokenmin,
        uint amountethmin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amounttoken, uint amounteth, uint liquidity) {
        (amounttoken, amounteth) = _addliquidity(
            token,
            weth,
            amounttokendesired,
            msg.value,
            amounttokenmin,
            amountethmin
        );
        address pair = uniswapv2library.pairfor(factory, token, weth);
        transferhelper.safetransferfrom(token, msg.sender, pair, amounttoken);
        iweth(weth).deposit{value: amounteth}();
        assert(iweth(weth).transfer(pair, amounteth));
        liquidity = iuniswapv2pair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amounteth) transferhelper.safetransfereth(msg.sender, msg.value - amounteth);
    }

    // **** remove liquidity ****
    function removeliquidity(
        address tokena,
        address tokenb,
        uint liquidity,
        uint amountamin,
        uint amountbmin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amounta, uint amountb) {
        address pair = uniswapv2library.pairfor(factory, tokena, tokenb);
        iuniswapv2pair(pair).transferfrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint amount0, uint amount1) = iuniswapv2pair(pair).burn(to);
        (address token0,) = uniswapv2library.sorttokens(tokena, tokenb);
        (amounta, amountb) = tokena == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amounta >= amountamin, "uniswapv2router: insufficient_a_amount");
        require(amountb >= amountbmin, "uniswapv2router: insufficient_b_amount");
    }
    function removeliquidityeth(
        address token,
        uint liquidity,
        uint amounttokenmin,
        uint amountethmin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amounttoken, uint amounteth) {
        (amounttoken, amounteth) = removeliquidity(
            token,
            weth,
            liquidity,
            amounttokenmin,
            amountethmin,
            address(this),
            deadline
        );
        transferhelper.safetransfer(token, to, amounttoken);
        iweth(weth).withdraw(amounteth);
        transferhelper.safetransfereth(to, amounteth);
    }
    function removeliquiditywithpermit(
        address tokena,
        address tokenb,
        uint liquidity,
        uint amountamin,
        uint amountbmin,
        address to,
        uint deadline,
        bool approvemax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amounta, uint amountb) {
        address pair = uniswapv2library.pairfor(factory, tokena, tokenb);
        uint value = approvemax ? uint(-1) : liquidity;
        iuniswapv2pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amounta, amountb) = removeliquidity(tokena, tokenb, liquidity, amountamin, amountbmin, to, deadline);
    }
    function removeliquidityethwithpermit(
        address token,
        uint liquidity,
        uint amounttokenmin,
        uint amountethmin,
        address to,
        uint deadline,
        bool approvemax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amounttoken, uint amounteth) {
        address pair = uniswapv2library.pairfor(factory, token, weth);
        uint value = approvemax ? uint(-1) : liquidity;
        iuniswapv2pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amounttoken, amounteth) = removeliquidityeth(token, liquidity, amounttokenmin, amountethmin, to, deadline);
    }

    // **** remove liquidity (supporting fee-on-transfer tokens) ****
    function removeliquidityethsupportingfeeontransfertokens(
        address token,
        uint liquidity,
        uint amounttokenmin,
        uint amountethmin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amounteth) {
        (, amounteth) = removeliquidity(
            token,
            weth,
            liquidity,
            amounttokenmin,
            amountethmin,
            address(this),
            deadline
        );
        transferhelper.safetransfer(token, to, ierc20(token).balanceof(address(this)));
        iweth(weth).withdraw(amounteth);
        transferhelper.safetransfereth(to, amounteth);
    }
    function removeliquidityethwithpermitsupportingfeeontransfertokens(
        address token,
        uint liquidity,
        uint amounttokenmin,
        uint amountethmin,
        address to,
        uint deadline,
        bool approvemax, uint8 v, bytes32 r, bytes32 s
    ) external virtual override returns (uint amounteth) {
        address pair = uniswapv2library.pairfor(factory, token, weth);
        uint value = approvemax ? uint(-1) : liquidity;
        iuniswapv2pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amounteth = removeliquidityethsupportingfeeontransfertokens(
            token, liquidity, amounttokenmin, amountethmin, to, deadline
        );
    }

    // **** swap ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = uniswapv2library.sorttokens(input, output);
            uint amountout = amounts[i + 1];
            (uint amount0out, uint amount1out) = input == token0 ? (uint(0), amountout) : (amountout, uint(0));
            address to = i < path.length - 2 ? uniswapv2library.pairfor(factory, output, path[i + 2]) : _to;
            iuniswapv2pair(uniswapv2library.pairfor(factory, input, output)).swap(
                amount0out, amount1out, to, new bytes(0)
            );
        }
    }
    function swapexacttokensfortokens(
        uint amountin,
        uint amountoutmin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = uniswapv2library.getamountsout(factory, amountin, path);
        require(amounts[amounts.length - 1] >= amountoutmin, "uniswapv2router: insufficient_output_amount");
        transferhelper.safetransferfrom(
            path[0], msg.sender, uniswapv2library.pairfor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swaptokensforexacttokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, to);
    }
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == WETH, "UniswapV2Router: INVALID_PATH");
        amounts = UniswapV2Library.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
    }
    function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WETH, "UniswapV2Router: INVALID_PATH");
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[path.length - 1] == WETH, "UniswapV2Router: INVALID_PATH");
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }
    function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
        external
        virtual
        override
        payable
        ensure(deadline)
        returns (uint[] memory amounts)
    {
        require(path[0] == WETH, "UniswapV2Router: INVALID_PATH");
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, "UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
        IWETH(WETH).deposit{value: amounts[0]}();
        assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
        _swap(amounts, path, to);
        // refund dust eth, if any
        if (msg.value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
    }

    // **** SWAP (supporting fee-on-transfer tokens) ****
    // requires the initial amount to have already been sent to the first pair
    function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output));
            uint amountInput;
            uint amountOutput;
            { // scope to avoid stack too deep errors
            (uint reserve0, uint reserve1,) = pair.getReserves();
            (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
            amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
            amountOutput = UniswapV2Library.getAmountOut(amountInput, reserveInput, reserveOutput);
            }
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
            address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) {
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn
        );
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        virtual
        override
        payable
        ensure(deadline)
    {
        require(path[0] == WETH, "UniswapV2Router: INVALID_PATH");
        uint amountIn = msg.value;
        IWETH(WETH).deposit{value: amountIn}();
        assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn));
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    )
        external
        virtual
        override
        ensure(deadline)
    {
        require(path[path.length - 1] == WETH, "UniswapV2Router: INVALID_PATH");
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn
        );
        _swapSupportingFeeOnTransferTokens(path, address(this));
        uint amountOut = IERC20(WETH).balanceOf(address(this));
        require(amountOut >= amountOutMin, "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
        IWETH(WETH).withdraw(amountOut);
        TransferHelper.safeTransferETH(to, amountOut);
    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return UniswapV2Library.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountIn)
    {
        return UniswapV2Library.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return UniswapV2Library.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return UniswapV2Library.getAmountsIn(factory, amountOut, path);
    }
}
