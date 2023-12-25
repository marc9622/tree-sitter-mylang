module.exports = grammar({
    name: 'mylang',

    extras: t => [
        /\s/,
        t.line_comment,
        t.block_comment,
    ],

    //word: t => t.value_id,

    inline: _ => [
    ],

    conflicts: t => [
        // In the case of '[] Type .' we could either be accessing
        // a namespaced type or starting a construction expression.
        [t.namespace_path, t.arr_type],

        // Same with '[] * Type .'
        [t.namespace_path, t.att_type],

        // In the case of 'value :: Type .' we coule either be
        // accessing a namespaced type or a member.
        [t.namespace_path, t._type_not_func],
        
        // In the case of 'id . id .' we could either be accessing
        // a namespace_path or a member.
        //[t.namespace_path, t._member_expr],

        // In the case of '& id . id .' we could either be accessing
        // a namespaced type or a member.
        //[t.namespace_path, t.namespaced_type, t.ref_expr],
        
        // In the case of 'value = () -> Void' we could either be assigning
        // a function type or a lambda expression.
        //[t._expr, t.lambda_expr],
        
        // When writing a for expression, the parser cannot tell
        // whether it will be a line branch or block branch without
        // looking ahead.
        [t.line_branches, t.block_branches],

        [t.namespace_path, t.namespaced_type],

        // In the case of 'Type .'  we could either be accessing
        // from a namespace_path or making a construct_expr.
        [t.namespace, t.namespaced_type],
        [t.namespace, t.construct_expr],

        // In the  case of '* Type .'
        [t.namespace, t.att_type],

        // In the case of '[] Type .'
        [t.namespace, t.arr_type],

        // In the case of 'value :: Type .'
        [t.namespace, t._type_not_func],
    ],

    rules: {
        source_file: t => repeat(choice(
            t._decl,
        )),

        //#region Comments
        line_comment: _ => token(seq(
            '//',
            /.*/,
        )),

        block_comment: _ => token(seq(
            '/*',
            // TODO: Allow nested block comments
            /[^*]*\*+([^/*][^*]*\*+)*/,
            '/',
        )),
        //#endregion Comments

        //#region Literals
        _literal: t => choice(
            t.bool_literal,
            t.str_literal,
            t._num_literal,
        ),

        bool_literal: _ => choice(
            'true', 'false',
        ),

        str_literal: _ => seq(
            '"',
            /[^"]*/,
            '"',
        ),

        _num_literal: t => choice(
            t.int_literal,
            t.dec_literal,
        ),

        int_literal: _ => choice(
            /\d[\d_]*[uUiI]?/,
            /0b[01_]+[uUiI]?/,
            /0o[0-7_]+[uUiI]?/,
            /0x[\da-fA-F_]+[uUiI]?/,
        ),

        dec_literal: _ =>
            /(\d*(\.\d+([\d_]+\d)?)[fF]?|\d+([\d_]+\d)?[fF])/,
        //#endregion Literals

        //#region Identifiers
        _id: t => choice(
            t.type_id,
            t.value_id,
        ),

        type_id: _ =>
            /[A-Z][a-zA-Z@\d]*/,

        value_id: _ =>
            /[_a-z@][_a-zA-Z@\d]*/,

        macro_id: _ =>
            /#[_a-zA-Z@]*[_a-zA-Z@\d]*/,
        //#endregion Identifiers

        //#region Types
        _type: t => choice(
            t.type_id,
            t.namespaced_type,
            t.param_type,
            t.att_type,
            t.arr_type,
            t.func_type,
            t.paren_type,
        ),

        _param_type_or_id: t => choice(
            t.type_id,
            t.param_type,
        ),

        _type_not_func: t => choice(
            t.type_id,
            t.namespaced_type,
            t.param_type,
            t.att_type,
            t.arr_type,
            t.paren_type,
        ),

        _type_not_paren: t => choice(
            t.type_id,
            t.namespaced_type,
            t.param_type,
            t.att_type,
            t.arr_type,
            t.func_type,
        ),

        namespace: t => choice(
            t.type_id,
            t.param_type,
        ),

        namespace_path: t => seq(
            choice(
                t.namespace,
                seq(
                    t.namespace_path,
                    '.',
                    t.namespace,
                ),
            ),
        ),

        namespaced_type: t => seq(
            t.namespace_path,
            '.',
            choice(
                t.type_id,
                t.param_type,
            ),
        ),

        param_type: t => seq(
            t.type_id,
            '(',
            opt(separate(
                choice(
                    t._param_decl,
                    t._expr,
                ),
                ',',
            )),
            ')',
        ),

        _param_decl: t => choice(
            t.param_value_decl,
            t.param_type_decl,
        ),

        param_value_decl: t => seq(
            field('decl_id', t.value_id), ':',
            opt(choice(
                seq(t._type_not_func, opt('+', t._impl_list)),
                t.param_type_decl,
                t.func_type,
            )),
            opt(t.local_alias),
        ),

        param_type_decl: t => seq(
            t.type_id, ':',
            t._type_not_func, opt('+', t._impl_list),
        ),

        att_type: t => seq(
            choice('*', '&', '^', '?', /*'!'*/),
            choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
                t.paren_type,
            ),
        ),

        arr_type: t => seq(
            '[',
            opt(t._expr),
            ']',
            choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
                t.paren_type,
            ),
        ),

        context_id: t => choice(
            t.value_id,
            'pure',
            'nopanic',
            'base',
            'async',
        ),

        context_decl: t => seq(
            t.value_id, ':', opt('context'),
        ),

        _context_param: t => choice(
            t.context_id, t.context_decl,
        ),

        func_type: t => seq(
            opt('[', separate(t._param_decl, ','), ']'),
            '(', opt(separate(t._param_decl, ',')), ')',
            opt(t._context_param), '->',
            opt(choice(t._type, t.param_type_decl)),
        ),

        paren_type: t => seq(
            '(', t._type, ')',
        ),

        capture_modifier: _ => choice(
            '*', '&', 'copy', 'move',
        ),

        capture_block: t => seq(
            '|',
            opt(separate(
                seq(t.capture_modifier, t.value_id),
                ','
            )),
            '|',
        ),
        //#endregion Types

        //#region Expressions
        _expr_or_control_stmt: t => choice(
            t._expr,
            t.control_stmt,
        ),

        _expr: t => choice(
            t._literal,
            t.value_id,
            t._type_not_paren,
            t.namespaced_expr,
            t.if_cond_line_expr,
            t.if_cond_block_expr,
            t.switch_expr,
            t.for_line_expr,
            t.for_block_expr,
            t.range_expr,
            t.builtin,
            t.construct_expr,
            t.ref_expr,
            t.static_expr,
            t.panic_expr,
            t.sizeof_expr,
            t.move_expr,
            t.negate_expr,
            t.muldiv_expr,
            t.addsub_expr,
            t.comp_expr,
            t.is_expr,
            t.and_expr,
            t.or_expr,
            t.as_expr,
            t.hint_expr,
            t.func_call,
            t.paren_expr,
            t.block_expr,
            t.lambda_expr,
            t._member_expr,
        ),

        _cond_expr: t => choice(
            t._literal,
            t.value_id,
            t.namespaced_expr,
            'uninit',
            'null',
            t.negate_expr,
            t.muldiv_expr,
            t.addsub_expr,
            t.comp_expr,
            t.is_expr,
            t.and_expr,
            t.or_expr,
            t.hint_expr,
            t.func_call,
            t.paren_expr,
            t.block_expr,
            t._member_expr,
        ),

        builtin: _ => choice(
            'uninit',
            'null',
            field('void', choice('void', seq('(', ')'))),
        ),

        line_branches: t => prec.right(choice(
            seq(
                'do', t._expr_or_control_stmt,
                opt(opt(';'), 'else', 'do', t._expr_or_control_stmt),
            ),
            seq(
                t.block_expr,
                'else', 'do', t._expr_or_control_stmt,
            ),
        )),

        block_branches: t => choice(
            seq(
                t.block_expr,
                opt('else', t.block_expr),
            ),
            seq(
                'do', t._expr_or_control_stmt,
                opt(';'), 'else', t.block_expr,
            ),
        ),

        if_cond_line_expr: t => seq(
            'if', t._cond_expr, t.line_branches,
        ),

        if_cond_block_expr: t => seq(
            'if', t._cond_expr, t.block_branches,
        ),

        switch_branch: t => choice(
            seq('do', t._expr_or_control_stmt, ';'),
            t.block_expr,
        ),

        switch_expr: t => seq(
            'switch', '{',
            repeat(seq(t._cond_expr, t.switch_branch)),
            opt('else', t.switch_branch),
            '}',
        ),

        for_line_expr: t => seq(
            'for',
            opt(t.value_id),
            opt('in', choice(t.value_id, t.range_expr)),
            t.line_branches,
        ),

        for_block_expr: t => seq(
            'for',
            opt(t.value_id),
            opt('in', t.value_id),
            t.block_branches,
        ),

        range_operator: _ => choice(
            '..=', '..<', '..>',
            '=..', '<..', '>..',
        ),

        range_operand: t => choice(
            t._literal,
            t.value_id,
            t.paren_expr,
            t._member_expr,
        ),

        range_expr: t => seq(
            t.range_operand,
            t.range_operator,
            t.range_operand,
        ),

        construct_expr: t => seq(
            choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
            ),
            t.struct_expr,
        ),

        struct_expr: t => seq(
            '.', '{',
            opt(separate(
                choice(
                    t._expr,
                    seq(t.value_id, '=', t._expr)),
                ',')
            ),
            '}',
        ),

        ref_expr: t => seq(
            choice(
                seq('&', t.value_id),
                seq(t.value_id, '^'),
            )
        ),

        static_expr: t => seq(
            'static', choice(
                t._literal,
                //t.value_id,
                //t.if_cond_single_expr,
                //t.if_cond_block_expr,
                //t.if_match_block_expr,
                //t.for_single_expr,
                //t.for_block_expr,
                //t.range_expr,
                //'uninit',
                //'null',
                //t.construct_expr,
                //t.sizeof_expr,
                //t.move_expr,
                //t.negate_expr,
                //t.muldiv_expr,
                //t.addsub_expr,
                //t.comp_expr,
                //t.is_expr,
                //t.and_expr,
                //t.or_expr,
                //t.as_expr,
                //t.hint_expr,
                //t.func_call,
                //t.paren_expr,
                //t._member_expr,
            ),
        ),

        panic_expr: t => seq(
            'panic', choice(
                t.str_literal,
                //t.value_id,
                //t.func_call,
                //t.paren_expr,
                //t._member_expr,
            ),
        ),

        sizeof_expr: t => seq(
            'sizeof', choice(
                t.type_id,
                //t.namespaced_type,
                //t.param_type,
                //t.att_type,
                //t.arr_type,
                //t.paren_type,
            ),
        ),

        move_operator: _ => choice(
            'move', 'copy',
        ),

        move_expr: t => seq(
            t.move_operator, choice(
                t._literal,
                t.value_id,
                t.ref_expr,
                //t.as_expr,
                t.func_call,
                t._member_expr,
            ),
        ),

        base_operand: t => choice(
            t._literal,
            t.value_id,
            t.namespaced_expr,
            'uninit',
            t.construct_expr,
            t.sizeof_expr,
            t.hint_expr,
            t.func_call,
            t.paren_expr,
            t.block_expr,
            t._member_expr,
        ),

        negate_operator: _ => choice(
            '-', '!', 'not',
        ),

        negate_operand: t => choice(
            t.base_operand,
            t.negate_expr,
        ),

        negate_expr: t => seq(
            t.negate_operator,
            t.negate_operand,
        ),

        muldiv_operator: _ => choice(
            '*', '/', '%',
        ),

        muldiv_operand: t => choice(
            t.negate_operand,
            t.muldiv_expr,
        ),

        muldiv_expr: t => prec.left(seq(
            t.muldiv_operand,
            t.muldiv_operator,
            t.muldiv_operand,
        )),

        addsub_operator: _ => choice(
            '+', '-',
        ),

        addsub_operand: t => choice(
            t.muldiv_operand,
            t.addsub_expr,
        ),

        addsub_expr: t => prec.left(seq(
            t.addsub_operand,
            t.addsub_operator,
            t.addsub_operand,
        )),

        comp_operator: _ => choice(
            '==', '!=', '<>', '<', '>', '<=', '>=',
        ),

        comp_operand: t => choice(
            t.addsub_operand,
            t.comp_expr,
        ),

        comp_expr: t => prec.left(seq(
            t.comp_operand,
            t.comp_operator,
            t.comp_operand,
        )),

        is_operand: t => choice(
            t._literal,
            t._id,
            t.namespaced_type,
            t.namespaced_expr,
            t.param_type,
            t.att_type,
            t.arr_type,
            t.range_expr,
            t.builtin,
            t.construct_expr,
            t.ref_expr,
            t.static_expr,
            t.panic_expr,
            t.sizeof_expr,
            t.move_expr,
            t.negate_expr,
            t.muldiv_expr,
            t.addsub_expr,
            t.comp_expr,
            t.is_expr,
            t.as_expr,
            t.hint_expr,
            t.func_call,
            t.paren_expr,
            t.block_expr,
            t._member_expr,
        ),

        is_expr: t => seq(
            t.is_operand,
            'is',
            choice(
                t._type,
                t.construct_expr,
            ),
        ),

        and_operand: t => choice(
            t.comp_operand,
            t.is_expr,
            t.and_expr,
        ),

        and_expr: t => prec.left(seq(
            t.and_operand,
            'and',
            t.and_operand,
        )),

        or_operand: t => choice(
            t.and_operand,
            t.or_expr,
        ),

        or_expr: t => prec.left(seq(
            t.or_operand,
            'or',
            t.or_operand,
        )),

        as_operand: t => choice(
            t._literal,
            t.value_id,
            t.namespaced_type,
            //t.param_type,
            //t.att_type,
            //t.arr_type,
            //t.func_type,
            t.construct_expr,
            t.hint_expr,
            t.paren_expr,
            t._member_expr,
        ),

        as_expr: t => seq(
            t.as_operand,
            'as',
            choice(
                t.type_id,
                t.param_type,
                //t.paren_expr,
            ),
        ),

        hint_operand: t => choice(
            t._literal,
            t.value_id,
            'uninit',
            'null',
            t.construct_expr,
            t.ref_expr,
            t.func_call,
            t.paren_expr,
            t._member_expr,
        ),

        hint_expr: t => seq(
            t.hint_operand,
            '::',
            t._type_not_func,
        ),

        func_call: t => seq(
            field('func_id', t.value_id),
            '(', opt(separate(t._expr, ',')), ')',
        ),

        paren_expr: t => seq(
            '(', t._expr, ')',
        ),

        block_expr: t => seq(
            opt(t.capture_block),
            '{',
            repeat(t.stmt),
            opt(t._line_stmt),
            '}',
        ),

        lambda_expr: t => seq(
            t.func_type,
            choice(
                seq('do', t._expr),
                t.block_expr,
            ),
        ),

        namespaced_expr: t => seq(
            choice(
                t.namespace_path,
                t.arr_type,
            ),
            '.',
            t.member,
        ),

        _member_operand: t => choice(
            t._literal,
            t.value_id,
            t.namespaced_expr,
            //t.param_type,
            //t.arr_type,
            t.construct_expr,
            t.ref_expr,
            //t.param_type,
            t.hint_expr,
            t.func_call,
            t.paren_expr,
            t.block_expr,
            t._member_expr,
        ),

        member: t => choice(
            t.value_id,
            t.func_call,
        ),

        member_value: t => seq(
            t._member_operand,
            '.',
            field('member', t.value_id),
        ),

        member_func_call: t => seq(
            t._member_operand,
            '.',
            field('member', t.func_call),
        ),

        _member_expr: t => choice(
            t.member_value,
            t.member_func_call,
        ),
        //#endregion Expressions

        //#region Statements
        stmt: t => choice(
            seq(t._line_stmt, ';'),
            t._block_stmt,
        ),

        _line_stmt: t => choice(
            t.if_cond_line_expr,
            t.for_line_expr,
            t.func_call,
            t.member_func_call,
            t.control_stmt,
            t.assign_stmt,
            t.defer_stmt,
        ),

        _block_stmt: t => choice(
            t.if_cond_block_expr,
            t.switch_expr,
            t.for_block_expr,
            t._decl,
        ),

        control_stmt: t => choice(
            t.return_stmt,
            t.break_stmt,
            'continue',
        ),

        assign_operator: _ => choice(
            '=', '+=', '-=', '*=', '/=',
        ),

        assign_stmt: t => seq(
            choice(
                t.value_id,
                //t.ref_expr,
                //t.func_call,
                //t.paren_expr,
                //t._member_expr,
            ),
            t.assign_operator,
            t._expr,
        ),

        import_stmt: t => seq(
            'import',
            t.import_namespace,
            ';',
        ),

        import_namespace: t => seq(
            t.type_id, repeat(seq('.', t.type_id))
        ),

        return_stmt: t => seq(
            'return', opt(t._expr),
        ),

        break_stmt: t => seq(
            'break', opt(t._expr),
        ),

        defer_stmt: t => seq(
            'defer', choice(
                //t.if_cond_single_expr,
                //t.if_cond_block_expr,
                //t.if_match_block_expr,
                //t.for_single_expr,
                //t.for_block_expr,
                //t.assign_stmt,
                //t.panic_expr,
                t.func_call,
                //t.paren_expr,
                //t._member_expr,
            ),
        ),
        //#endregion Statements

        //#region Declarations
        _decl: t => choice(
            t.import_stmt,
            t.value_decl,
            t.alias_decl,
            t.newtype_decl,
            t.struct_decl,
            t.union_decl,
            t.enum_decl,
            t.trait_decl,
            t.for_decl,
            t.impl_decl,
        ),

        decl_keyword: _ => choice(
            'var', 'let', 'def', 'virt', 'extern', 'intern',
        ),

        value_decl: t => seq(
            opt('pub'),
            t.decl_keyword,
            opt('pure'),
            choice(
                t.empty_decl,
                t.assign_decl,
                t.block_decl,
                t.func_decl,
            ),
        ),

        macro: _ =>
            'macro',

        empty_decl: t => seq(
            opt(t.macro),
            choice(
                t._id,
                t._param_decl,
            ), ';',
        ),

        assign_decl: t => seq(
            opt(t.macro),
            choice(
                t._id,
                t._param_decl,
            ),
            '=', t._expr, ';',
        ),

        block_decl: t => seq(
            opt(t.macro),
            choice(
                t._id,
                t._param_decl,
            ),
            t.block_expr,
        ),

        func_decl: t => seq(
            seq(
                opt(t.macro),
                field('decl_id', t.value_id),
                opt('[', separate(t._param_decl, ','), ']'),
                '(', opt(separate(t._param_decl, ',')), ')',
            ),
            opt(t._context_param), '->',
            opt(t._type),
            seq(
                choice(
                    seq('do', t._expr, ';'),
                    t.block_expr,
                    ';',
                ),
            ),
        ),

        alias_decl: t => seq(
            opt('pub'), 'alias', t._param_type_or_id,
            '=', t._type, ';',
        ),

        newtype_decl: t => seq(
            opt('pub'), 'newtype', t._param_type_or_id,
            '=', t._type, ';',
        ),

        local_alias: t => seq(
            'as', t._param_type_or_id
        ),

        struct_inner_decl: t => choice(
            t.value_decl,
            t.newtype_decl,
            t.struct_decl,
            t.union_decl,
            t.for_decl,
            t.impl_decl,
        ),

        struct_decl: t => seq(
            opt('pub'), 'struct',
            t._param_type_or_id,
            opt(t.local_alias),
            '{',
            repeat(choice(
                seq(
                    opt('pub'), t.value_id,
                    ':',
                    t._type,
                    ';',
                ),
            )),
            '}',
        ),

        union_decl: t => seq(
            opt('pub'), 'union',
            t._param_type_or_id,
            opt(t.local_alias),
            '{',
            opt(
                separate(
                    t._type,
                    ';',
                ),
            ),
            '}',
        ),

        enum_decl: t => seq(
            opt('pub'), 'enum', t.type_id,
            ':', t._param_type_or_id,
            '{',
            repeat(choice(
                seq(t.type_id, '=', t._expr, ';'),
                seq(t.type_id, '{', repeat(t.control_stmt), '}'),
            )),
            '}',
        ),

        trait_decl: t => seq(
            opt('pub'), 'trait',
            opt(t._param_type_or_id, ':'),
            t._param_type_or_id,
            opt('for', choice(t.type_id, t.param_type, t._param_decl)),
            choice(
                seq(
                    '{',
                    repeat(choice(
                        t.for_decl,
                        t.impl_decl,
                    )),
                    '}'
                ),
                ';',
            ),
        ),

        for_decl: t => seq(
            'for', t._for_param,
            opt(opt('pub'), 'impl', t._impl_list),
            choice(
                //t.value_decl,
                //t.alias_decl,
                //t.newtype_decl,
                //t.struct_decl,
                //t.union_decl,
                //t.enum_decl,
                //t.trait_decl,
                //t.for_decl,
                t._decl_list,
                //';',
            ),
        ),

        impl_decl: t => seq(
            opt('pub'), 'impl', t._impl_list,
            opt('for', t._for_param),
            choice(
                //t.value_decl,
                t._decl_list,
                ';',
            ),
        ),

        where_decl: t => seq(
            'where',
            separate(t.param_type_decl, ','),
        ),

        _for_param: t => choice(
            seq(
                choice(
                    t.type_id,
                    t.param_type,
                    t.arr_type,
                    t.att_type,
                ),
                t.local_alias,
            ),
            t._param_decl,
        ),

        _impl_list: t => seq(
            choice(
                t.type_id,
                t.param_type,
                t.paren_type
            ),
            repeat(seq(
                '+',
                choice(
                    t.type_id,
                    t.param_type,
                    t.paren_type
                ),
            )),
        ),

        _decl_list: t => seq(
            '{', repeat(t._decl), '}',
        ),
        //#endregoin Declarations
    },
});

function opt(...rule) {
    return optional(seq(...rule));
}

function separate(rule, delimeter) {
    return seq(
        rule,
        repeat(seq(delimeter, rule)),
        opt(delimeter),
    );
}

function bi_expr(precedence, operand, operator) {
    return prec.left(precedence, seq(
        field('left', operand),
        operator,
        field('right', operand),
    ));
}
