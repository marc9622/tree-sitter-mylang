
;(line_comment) @comment
;(block_comment) @comment

;(int_literal) @number
;(dec_literal) @number

;(str_literal) @string

;(type_id) @type
;(value_id) @field
;[(macro_id) "macro"] @macro

;(func_call func_id: (value_id) @function)
;(param_value_decl decl_id: (value_id) @function (func_type))
;(func_decl decl_id: (value_id) @function)
;(func_decl "macro" decl_id: (value_id) @macro)

[
;"+"
;"-"
;"*"
;"/"
;"%"
;"!"
;"&"
;"^"
;"?"
;"::"
;"..=" "=.."
;"..<" "<.."
;"..>" ">.."
;"="
;"+=" "-="
;"*=" "/="
;"==" "!="
;"<=" ">="
;"<" ">" "<>"
;"->"
] @operator

[
;"."
;":"
;","
;";"
] @punctuation.delimiter

[
;"("
;")"
;"["
;"]"
;"{"
;"}"
;"|"
] @punctuation.bracket

[
;"true"
;"false"
] @boolean

[
;"uninit"
;"null"
;"void"
;void: ["(" ")"]
] @constant.builtin

[
;"import"
;"with"
;"as"
;"alias"
;"newtype"
;"struct"
;"union"
;"enum"
;"exposed"
;"trait"
;"impl"
;"for"
;"pub"
;"var"
;"def"
;"virt"
;"extern"
;"intern"
;"macro"
;"if"
;;"switch"
;"at"
;"range"
;"in"
;"else"
;"is"
;"and"
;"or"
;"not"
;"move"
;"copy"
;"sizeof"
;"panic"
;"return"
;"break"
;"continue"
;"defer"
;"do"
] @keyword

